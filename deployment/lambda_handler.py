"""AWS Lambda handler for IBKR Tax Calculator web application."""
import json
import base64
import tempfile
import os
from typing import Dict, Any
import boto3
import uuid
import datetime
import re
from io import StringIO

# Import our application components
import sys
sys.path.append('/opt/python')  # Lambda layer path
sys.path.append('.')
sys.path.append('./main/python')  # Add the main/python directory to path

# Global flags
CALCULATOR_AVAILABLE = False
CONVERTERS_AVAILABLE = False

# Import converters (light dependencies)
try:
    from main.python.converters.converter_factory import get_factory
    from main.python.converters import register_default_converters
    from main.python.parsers.multi_broker_parser import MultiBrokerParser
    from main.python.interfaces.broker_converter import BrokerConversionError
    
    # Register all available converters
    register_default_converters()
    CONVERTERS_AVAILABLE = True
except ImportError as e:
    print(f"Converter import error: {e}")

# Import calculator (heavy dependencies like pandas)
try:
    from main.python.capital_gains_calculator import create_enhanced_calculator
    from main.python.services.portfolio_report_generator import PortfolioReportGenerator
    from main.python.services.portfolio_calculator import PortfolioCalculator
    from main.python.services.market_price_service import YFinanceMarketPriceService
    from main.python.services.unrealised_gains_calculator import UnrealisedGainsCalculator
    from main.python.parsers.csv_parser import CSVValidationError, REQUIRED_CSV_COLUMNS
    CALCULATOR_AVAILABLE = True
except ImportError as e:
    print(f"Calculator import error: {e}")
    # Fallback - we'll handle this in the handler
    CSVValidationError = None
    REQUIRED_CSV_COLUMNS = []


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    AWS Lambda handler for processing tax calculation requests.

    Supports both API Gateway and direct invocation.
    """
    try:
        # Parse the request
        if 'httpMethod' in event:
            # API Gateway request
            return handle_api_gateway_request(event, context)
        else:
            # Direct Lambda invocation
            return handle_direct_invocation(event, context)

    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
            },
            'body': json.dumps({
                'error': str(e),
                'message': 'Internal server error occurred'
            })
        }


def handle_api_gateway_request(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Handle API Gateway HTTP request."""

    method = event['httpMethod']
    path = event['path']

    # Debug logging
    print(f"Method: {method}, Path: {path}")
    print(f"Headers: {event.get('headers', {})}")
    body = event.get('body', '')
    print(f"Body length: {len(body) if body else 0}")
    
    # CORS preflight
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
            },
            'body': ''
        }
    
    # Serve static HTML pages
    if method == 'GET':
        if path == '/' or path == '/index.html':
            return serve_landing_page()
        elif path == '/health':
            # Lightweight health/status endpoint for ALB/API Gateway monitoring
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
                },
                'body': json.dumps({'status': 'ok'})
            }
        elif path == '/about':
            return serve_about_page()
        elif path == '/privacy':
            return serve_privacy_page()
        elif path == '/terms':
            return serve_terms_page()
        elif path == '/help':
            return serve_help_page()
        elif path == '/cgt-guide':
            return serve_cgt_guide_page()
        elif path == '/blog':
            return serve_blog_page()
        elif path == '/ads.txt':
            return serve_ads_txt()

    # Handle feedback submission
    elif method == 'POST' and path == '/feedback':
        return handle_feedback_request(event)

    # Handle file upload and processing
    elif method == 'POST' and (path == '/calculate' or path == '/'):
        return handle_calculation_request(event)
    
    # Handle broker detection preview
    elif method == 'POST' and path == '/detect-broker':
        return handle_broker_detection_request(event)

    # Handle unrealised gains / predictive tax calculation
    elif method == 'POST' and path == '/unrealised-gains':
        return handle_unrealised_gains_request(event)
    
    # 404 for unknown paths
    return {
        'statusCode': 404,
        'headers': {
            'Content-Type': 'text/html',
            'Access-Control-Allow-Origin': '*'
        },
        'body': '<h1>404 - Page Not Found</h1>'
    }


def handle_feedback_request(event: Dict[str, Any]) -> Dict[str, Any]:
    """Handle feedback submission."""
    try:
        # Parse request body
        if event.get('isBase64Encoded', False):
            body = base64.b64decode(event['body']).decode('utf-8')
        else:
            body = event['body']
            
        if not body:
             return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Empty request body'})
            }

        data = json.loads(body)
        message = data.get('message', '').strip()
        contact = data.get('contact', '').strip() # Optional contact info

        # Validation
        if not message:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Message is required'})
            }
        
        if len(message) > 1000:
             return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Message too long (max 1000 characters)'})
            }
            
        # Basic sanitization (prevent XSS if we ever display this HTML/Raw)
        # We allow basic punishment/alphanumeric. 
        # Actually for text file storage, strict sanitization isn't strictly necessary for security 
        # (it won't execute), but good practice for reading logs.
        # We'll replace non-printable characters.
        cleaned_message = "".join(ch for ch in message if ch.isprintable() or ch in '\n\r\t')
        
        # Determine bucket from environment or hardcode fallback (not ideal for strict prod but acceptable here)
        # In Terraform, we pass bucket name usually? Or we can deduce it.
        # The frontend bucket is known: ibkr-tax-useast1-complete-websitebucket-mz2iwsaztkjo
        # We can write to the same bucket in a private folder.
        bucket_name = os.environ.get('S3_BUCKET_NAME', 'ibkr-tax-useast1-complete-websitebucket-mz2iwsaztkjo')
        
        timestamp = datetime.datetime.utcnow().isoformat()
        request_id = str(uuid.uuid4())
        today = datetime.datetime.utcnow().strftime('%Y-%m-%d')
        key = f"feedback/{today}/{request_id}.txt"
        
        file_content = f"Date: {timestamp}\nID: {request_id}\nContact: {contact}\n\nMessage:\n{cleaned_message}"
        
        s3 = boto3.client('s3')
        s3.put_object(
            Bucket=bucket_name,
            Key=key,
            Body=file_content,
            ContentType='text/plain'
        )
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'message': 'Feedback received', 'id': request_id})
        }

    except Exception as e:
        print(f"Error handling feedback: {e}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Internal server error'})
        }


def log_error_file_to_s3(file_content: str, filename: str, error_type: str, error_message: str, extra_metadata: dict = None) -> str:
    """
    Log problematic files to S3 for debugging parsing failures.
    
    Args:
        file_content: The content of the file that caused the error
        filename: Original filename
        error_type: Type of error (e.g., 'broker_detection', 'csv_validation', 'conversion')
        error_message: Detailed error message
        extra_metadata: Additional context (e.g., detected columns, broker hints)
    
    Returns:
        The S3 key where the error was logged, or empty string on failure
    """
    try:
        bucket_name = os.environ.get('S3_BUCKET_NAME', 'ibkr-tax-useast1-complete-websitebucket-mz2iwsaztkjo')
        
        timestamp = datetime.datetime.utcnow()
        request_id = str(uuid.uuid4())[:8]
        today = timestamp.strftime('%Y-%m-%d')
        
        # Sanitize filename for S3 key
        safe_filename = re.sub(r'[^a-zA-Z0-9._-]', '_', filename or 'unknown')
        
        # Prepare file content (limit to first 500 lines to avoid huge files)
        lines = file_content.split('\n') if file_content else []
        truncated_content = '\n'.join(lines[:500])
        if len(lines) > 500:
            truncated_content += f"\n\n... [truncated {len(lines) - 500} more lines]"
        
        # Create metadata JSON
        metadata = {
            'timestamp': timestamp.isoformat(),
            'request_id': request_id,
            'original_filename': filename,
            'error_type': error_type,
            'error_message': error_message,
            'file_size_bytes': len(file_content) if file_content else 0,
            'line_count': len(lines),
            'first_line': lines[0] if lines else None,
            **(extra_metadata or {})
        }
        
        s3 = boto3.client('s3')
        
        # Save the file content
        file_key = f"errors/{today}/{request_id}_{safe_filename}"
        s3.put_object(
            Bucket=bucket_name,
            Key=file_key,
            Body=truncated_content,
            ContentType='text/plain'
        )
        
        # Save metadata as JSON
        metadata_key = f"errors/{today}/{request_id}_{safe_filename}.metadata.json"
        s3.put_object(
            Bucket=bucket_name,
            Key=metadata_key,
            Body=json.dumps(metadata, indent=2),
            ContentType='application/json'
        )
        
        print(f"Logged error file to S3: {file_key}")
        return file_key
        
    except Exception as e:
        print(f"Failed to log error file to S3: {e}")
        return ""


def detect_broker_from_file(file_path: str) -> Dict[str, Any]:
    """
    Detect broker from file and return metadata.
    
    Returns:
        Dictionary with broker detection results and file metadata
    """
    try:
        if not CONVERTERS_AVAILABLE:
            return {
                'detected': False,
                'error': 'Broker detection unavailable (missing dependencies)'
            }
            
        factory = get_factory()
        
        # Detect broker
        detection = factory.detect_broker(file_path, min_confidence=0.5)
        
        if not detection:
            return {
                'detected': False,
                'error': 'Could not detect broker from file. Please ensure the file is in a supported format.',
                'supported_brokers': factory.list_brokers()
            }
        
        broker_name = detection['broker']
        confidence = detection['confidence']
        converter = detection['converter']
        
        # Validate file structure
        validation = converter.validate_file_structure(file_path)
        
        # Try to parse a preview of transactions
        transaction_preview = []
        date_range = None
        
        try:
            transactions = converter.convert(file_path, base_currency="GBP")
            transaction_count = len(transactions)
            
            # Get date range
            if transactions:
                dates = [tx.date for tx in transactions if tx.date]
                if dates:
                    date_range = {
                        'start': min(dates).isoformat(),
                        'end': max(dates).isoformat()
                    }
                
                # Get preview of first few transactions
                for tx in transactions[:5]:
                    transaction_preview.append({
                        'date': tx.date.isoformat() if tx.date else None,
                        'symbol': tx.symbol,
                        'type': tx.transaction_type.value if hasattr(tx.transaction_type, 'value') else str(tx.transaction_type),
                        'quantity': float(tx.quantity),
                        'price': float(tx.price),
                        'currency': tx.transaction_currency
                    })
        except Exception as e:
            print(f"Warning: Could not parse transaction preview: {e}")
            transaction_count = validation.get('row_count', 0)
        
        return {
            'detected': True,
            'broker': broker_name,
            'confidence': confidence,
            'validation': {
                'valid': validation['valid'],
                'errors': validation.get('errors', []),
                'warnings': validation.get('warnings', []),
                'row_count': validation.get('row_count', 0)
            },
            'metadata': {
                'transaction_count': transaction_count,
                'date_range': date_range,
                'transaction_preview': transaction_preview
            },
            'alternatives': [
                {
                    'broker': alt['broker'],
                    'confidence': alt['confidence']
                }
                for alt in detection.get('alternatives', [])[:3]
            ]
        }
        
    except Exception as e:
        return {
            'detected': False,
            'error': f'Error detecting broker: {str(e)}'
        }


def handle_broker_detection_request(event: Dict[str, Any]) -> Dict[str, Any]:
    """Handle broker detection preview request."""
    
    try:
        # Parse request body
        if event.get('isBase64Encoded', False):
            body = base64.b64decode(event['body'])
        else:
            body = event['body'].encode('utf-8') if isinstance(event['body'], str) else event['body']

        # Parse multipart form data
        content_type = event.get('headers', {}).get('content-type', '') or event.get('headers', {}).get('Content-Type', '')

        if 'multipart/form-data' in content_type:
            files, _, _ = parse_multipart_data_proper(body, content_type)
            if not files:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({
                        'error': 'No file content received'
                    })
                }
            # Use the first file for detection
            file_content = files[0]['content']
            filename = files[0]['filename']
        else:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'Invalid request format. Expected multipart/form-data.'
                })
            }

        if not file_content:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'No file content received'
                })
            }

        # Determine file type from filename
        file_type = "csv"  # default
        if filename:
            if filename.lower().endswith(('.qfx', '.ofx')):
                file_type = "qfx"
            elif filename.lower().endswith('.csv'):
                file_type = "csv"

        # Create temporary file
        file_suffix = f'.{file_type}'
        with tempfile.NamedTemporaryFile(mode='w', suffix=file_suffix, delete=False) as temp_file:
            temp_file.write(file_content)
            temp_file_path = temp_file.name

        try:
            # Detect broker
            detection_result = detect_broker_from_file(temp_file_path)
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    **detection_result,
                    'filename': filename,
                    'file_type': file_type
                })
            }
            
        finally:
            # Clean up temporary file
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': str(e),
                'message': 'Error processing broker detection request'
            })
        }


def handle_calculation_request(event: Dict[str, Any]) -> Dict[str, Any]:
    """Handle tax calculation request with file upload."""

    try:
        if not CALCULATOR_AVAILABLE:
            return {
                'statusCode': 503,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'Service Unavailable',
                    'message': 'Calculation service is currently unavailable due to missing dependencies.'
                })
            }

        # Parse request body
        if event.get('isBase64Encoded', False):
            body = base64.b64decode(event['body'])
        else:
            body = event['body'].encode('utf-8') if isinstance(event['body'], str) else event['body']

        # Parse multipart form data
        content_type = event.get('headers', {}).get('content-type', '') or event.get('headers', {}).get('Content-Type', '')

        if 'multipart/form-data' in content_type:
            # Extract file content and parameters from multipart data
            files, tax_year, analysis_type = parse_multipart_data_proper(body, content_type)
            print(f"Parsed multipart data: {len(files)} files, tax_year={tax_year}, analysis_type={analysis_type}")
            if files:
                print(f"First file: {files[0]['filename']}")
            else:
                print("WARNING: No file content received!")
        else:
            # JSON request (fallback)
            try:
                data = json.loads(body.decode('utf-8') if isinstance(body, bytes) else body)
                file_content = data.get('file_content', '')
                filename = data.get('filename', '')
                files = [{'content': file_content, 'filename': filename}]
                tax_year = data.get('tax_year', '2024-2025')
                analysis_type = data.get('analysis_type', 'both')
            except:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'text/html',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': '<h1>Error</h1><p>Invalid request format. Please use the web form to upload files.</p>'
                }

        # Process files
        temp_file_paths = []
        file_type = "csv" # Default
        
        try:
            for file_data in files:
                file_content = file_data['content']
                filename = file_data['filename']
                
                # Determine file type from filename (use the first file's type if multiple)
                if filename:
                    if filename.lower().endswith(('.qfx', '.ofx')):
                        file_type = "qfx"
                    elif filename.lower().endswith('.csv'):
                        file_type = "csv"

                # Create temporary file with correct extension
                file_suffix = f'.{file_type}'
                with tempfile.NamedTemporaryFile(mode='w', suffix=file_suffix, delete=False) as temp_file:
                    temp_file.write(file_content)
                    temp_file_paths.append(temp_file.name)

            # Detect broker and get metadata (for CSV files) - only for the first file for now
            broker_metadata = None
            if file_type == 'csv' and temp_file_paths:
                print(f"Detecting broker for CSV file: {files[0]['filename']}")
                detection_result = detect_broker_from_file(temp_file_paths[0])
                
                if not detection_result.get('detected'):
                    # Broker detection failed - log to S3 for debugging
                    error_msg = detection_result.get('error', 'Unknown error')
                    supported_brokers = detection_result.get('supported_brokers', [])
                    
                    # Log the problematic file to S3
                    if files:
                        log_error_file_to_s3(
                            file_content=files[0].get('content', ''),
                            filename=files[0].get('filename', 'unknown'),
                            error_type='broker_detection',
                            error_message=error_msg,
                            extra_metadata={'supported_brokers': supported_brokers}
                        )
                    
                    return {
                        'statusCode': 400,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({
                            'error': 'Broker detection failed',
                            'message': error_msg,
                            'supported_brokers': supported_brokers
                        })
                    }
                
                broker_metadata = {
                    'broker': detection_result['broker'],
                    'confidence': detection_result['confidence'],
                    'transaction_count': detection_result['metadata']['transaction_count'],
                    'date_range': detection_result['metadata']['date_range']
                }
                
                print(f"Detected broker: {broker_metadata['broker']} (confidence: {broker_metadata['confidence']})")
            
            # Process the files with correct parser
            calculator = create_enhanced_calculator(file_type)
            print(f"Using {file_type} parser for {len(temp_file_paths)} files")
            
            # Pass list of files if multiple, or single file if just one
            files_to_process = temp_file_paths if len(temp_file_paths) > 1 else temp_file_paths[0]
            
            results = calculator.calculate_comprehensive_analysis(
                files_to_process, tax_year, analysis_type
            )
            
            # Serialize results to JSON
            json_results = serialize_results(results, calculator)
            
            # Add broker metadata to response if available
            if broker_metadata:
                json_results['broker_metadata'] = broker_metadata
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps(json_results)
            }
        
        except BrokerConversionError as e:
            # Handle broker conversion errors - log to S3
            if files:
                log_error_file_to_s3(
                    file_content=files[0].get('content', ''),
                    filename=files[0].get('filename', 'unknown'),
                    error_type='broker_conversion',
                    error_message=str(e),
                    extra_metadata={'broker': e.broker if hasattr(e, 'broker') else 'Unknown'}
                )
            
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'Broker conversion failed',
                    'message': str(e),
                    'broker': e.broker if hasattr(e, 'broker') else 'Unknown'
                })
            }
        
        except CSVValidationError as e:
            # Handle CSV validation errors - log to S3
            if files:
                log_error_file_to_s3(
                    file_content=files[0].get('content', ''),
                    filename=files[0].get('filename', 'unknown'),
                    error_type='csv_validation',
                    error_message='Missing required columns',
                    extra_metadata={
                        'missing_columns': e.missing_columns if hasattr(e, 'missing_columns') else [],
                        'required_columns': REQUIRED_CSV_COLUMNS
                    }
                )
            
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'Invalid CSV format',
                    'message': 'Missing required columns',
                    'missing_columns': e.missing_columns if hasattr(e, 'missing_columns') else [],
                    'required_columns': REQUIRED_CSV_COLUMNS
                })
            }
            
        finally:
            # Clean up temporary files
            for path in temp_file_paths:
                if os.path.exists(path):
                    try:
                        os.unlink(path)
                    except Exception as e:
                        print(f"Error deleting temp file {path}: {e}")
    
    except Exception as e:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': str(e),
                'message': 'Error processing your request'
            })
        }


def handle_direct_invocation(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Handle direct Lambda invocation (for testing or API calls)."""
    
    file_content = event.get('file_content', '')
    tax_year = event.get('tax_year', '2024-2025')
    analysis_type = event.get('analysis_type', 'both')
    
    # Create temporary file
    with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as temp_file:
        temp_file.write(file_content)
        temp_file_path = temp_file.name
    
    try:
        # Process the file
        calculator = create_enhanced_calculator("csv")
        results = calculator.calculate_comprehensive_analysis(
            temp_file_path, tax_year, analysis_type
        )
        
        # Return JSON results
        return {
            'statusCode': 200,
            'body': {
                'results': serialize_results(results),
                'message': 'Calculation completed successfully'
            }
        }
        
    finally:
        # Clean up temporary file
        if os.path.exists(temp_file_path):
            os.unlink(temp_file_path)


def parse_multipart_data_proper(body: bytes, content_type: str) -> tuple:
    """Parse multipart form data using python-multipart."""
    try:
        from multipart import parse_options_header, MultipartParser

        # Extract boundary from content type
        _, options = parse_options_header(content_type)
        boundary = options.get('boundary')

        if not boundary:
            raise ValueError("No boundary found in content type")

        # Parse the multipart data
        parser = MultipartParser(boundary.encode())
        parts = parser.parse(body)

        files = []
        tax_year = "2024-2025"
        analysis_type = "both"

        for part in parts:
            name = part.name
            if name and name.startswith('file'):  # Match file, file0, file1, etc.
                file_content = part.raw.decode('utf-8')
                filename = ""
                # Extract filename from Content-Disposition header
                # Try different ways to get the filename
                if hasattr(part, 'filename') and part.filename:
                    filename = part.filename
                elif hasattr(part, 'headers') and part.headers:
                    # Look for Content-Disposition header
                    content_disp = part.headers.get('Content-Disposition', '')
                    if 'filename=' in content_disp:
                        # Extract filename from header
                        import re
                        pattern = r'filename="?([^"]+)"?'
                        match = re.search(pattern, content_disp)
                        if match:
                            filename = match.group(1)
                
                print(f"Extracted filename: '{filename}' from file part")
                files.append({
                    'content': file_content,
                    'filename': filename
                })
            elif name == 'tax_year':
                tax_year = part.value
            elif name == 'analysis_type':
                analysis_type = part.value

        return files, tax_year, analysis_type

    except Exception:
        # Fallback to simple parsing if multipart library fails
        body_str = body.decode('utf-8', errors='ignore')
        return parse_multipart_data_simple(body_str)


def parse_multipart_data_simple(body: str) -> tuple:
    """Parse multipart form data (simplified implementation)."""
    # This is a basic implementation - fallback method
    lines = body.split('\n')
    files = []
    current_file_content = ""
    current_filename = ""
    tax_year = "2024-2025"
    analysis_type = "both"

    # Extract form fields and file content
    in_file = False
    current_field = None

    for i, line in enumerate(lines):
        if 'name="file' in line:  # Match name="file", name="file0", name="file1", etc.
            # If we were processing a file, save it
            if current_filename or current_file_content:
                files.append({
                    'content': current_file_content.strip(),
                    'filename': current_filename
                })
                current_file_content = ""
                current_filename = ""
            
            in_file = True
            current_field = 'file'
            # Extract filename from Content-Disposition
            if 'filename=' in line:
                import re
                pattern = r'filename="?([^"]+)"?'
                match = re.search(pattern, line)
                if match:
                    current_filename = match.group(1)
            continue
        elif 'name="tax_year"' in line:
            current_field = 'tax_year'
            in_file = False
            continue
        elif 'name="analysis_type"' in line:
            current_field = 'analysis_type'
            in_file = False
            continue
        elif line.startswith('--') and current_field:
            if current_field == 'file':
                files.append({
                    'content': current_file_content.strip(),
                    'filename': current_filename
                })
                current_file_content = ""
                current_filename = ""
            current_field = None
            in_file = False
            continue
        elif current_field == 'file' and in_file and line.strip() and not line.startswith('Content-'):
            current_file_content += line + '\n'
        elif current_field == 'tax_year' and line.strip() and not line.startswith('Content-'):
            tax_year = line.strip()
            current_field = None
        elif current_field == 'analysis_type' and line.strip() and not line.startswith('Content-'):
            analysis_type = line.strip()
            current_field = None
            
    # Add the last file if exists
    if current_filename or current_file_content:
        files.append({
            'content': current_file_content.strip(),
            'filename': current_filename
        })

    return files, tax_year, analysis_type


def handle_unrealised_gains_request(event: Dict[str, Any]) -> Dict[str, Any]:
    """Handle POST /unrealised-gains — live prices + predictive CGT.

    Request (multipart/form-data):
        file          – CSV or QFX transaction file (same as /calculate)
        tax_year      – Optional, e.g. "2025-2026" (defaults to "2025-2026")
        already_realised_gain_gbp – Optional float, net gain already realised
                                    this tax year (used for combined estimate)

    Response (JSON):
        {
          "tax_year": ...,
          "hypothetical_sale_date": ...,
          "portfolio": { "total_current_value_gbp": ..., ... },
          "predictive_cgt": { "net_gain_gbp": ..., "taxable_gain_gbp": ...,
                              "estimated_tax_basic_rate_gbp": ..., ... },
          "combined_with_realised": { ... },
          "warnings": { "affected_by_bb_rule": bool,
                        "bb_rule_affected_symbols": [...] },
          "positions": [ { "symbol": ..., "quantity": ...,
                           "current_price_gbp": ..., "unrealised_gain_loss_gbp": ...,
                           "has_recent_buys": bool, ... }, ... ]
        }
    """
    if not CALCULATOR_AVAILABLE:
        return {
            'statusCode': 503,
            'headers': {'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Calculation service unavailable'})
        }

    try:
        # Parse request
        if event.get('isBase64Encoded', False):
            body = base64.b64decode(event['body'])
        else:
            body = (event['body'].encode('utf-8')
                    if isinstance(event['body'], str) else event['body'])

        content_type = (event.get('headers', {}).get('content-type', '')
                        or event.get('headers', {}).get('Content-Type', ''))

        if 'multipart/form-data' not in content_type:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Expected multipart/form-data'})
            }

        files, tax_year, analysis_type = parse_multipart_data_proper(body, content_type)

        # Extract extra fields from multipart (already_realised_gain_gbp)
        already_realised_gain_gbp = 0.0
        try:
            # Re-parse to extract the extra field (parse_multipart_data_proper
            # only returns files + tax_year + analysis_type)
            from multipart import parse_options_header, MultipartParser
            _, options = parse_options_header(content_type)
            boundary = options.get('boundary', b'')
            parser = MultipartParser(boundary if isinstance(boundary, bytes)
                                     else boundary.encode())
            for part in parser.parse(body):
                if part.name == 'already_realised_gain_gbp':
                    already_realised_gain_gbp = float(part.value or 0)
        except Exception:
            pass  # Field optional — default 0

        if not files:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'No file uploaded'})
            }

        file_data = files[0]
        filename = file_data.get('filename', '')
        file_content = file_data.get('content', '')
        file_type = 'qfx' if filename.lower().endswith(('.qfx', '.ofx')) else 'csv'

        temp_file_paths = []
        try:
            with tempfile.NamedTemporaryFile(
                mode='w', suffix=f'.{file_type}', delete=False
            ) as tmp:
                tmp.write(file_content)
                temp_file_paths.append(tmp.name)

            # 1. Parse transactions
            calculator = create_enhanced_calculator(file_type)
            all_transactions = calculator.parser.parse(temp_file_paths[0])

            # 1b. Auto-compute this tax year's realised gain/loss from the file.
            # The manual already_realised_gain_gbp form field is for gains from
            # *other* accounts; the file's own sells are computed here automatically.
            try:
                tax_summary = calculator.tax_year_calculator.calculate_comprehensive_tax_summary(
                    all_transactions, tax_year
                )
                if tax_summary.capital_gains:
                    realised_from_file = tax_summary.capital_gains.net_gain
                    already_realised_gain_gbp += realised_from_file
                    print(
                        f"Auto-computed realised gain from file for {tax_year}: "
                        f"£{realised_from_file:.2f}"
                    )
            except Exception as exc:
                print(f"Warning: Could not auto-compute realised gains: {exc}")

            # 2. Compute current holdings
            portfolio_calc = PortfolioCalculator()
            holdings = portfolio_calc.calculate_current_holdings(all_transactions)

            if not holdings:
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json',
                                'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'message': 'No current holdings found',
                        'tax_year': tax_year,
                        'positions': [],
                        'portfolio': {
                            'total_current_value_gbp': 0,
                            'total_cost_basis_gbp': 0,
                            'total_unrealised_gain_loss_gbp': 0,
                            'number_of_positions': 0,
                        }
                    })
                }

            # 3. Fetch live prices
            price_svc = YFinanceMarketPriceService()
            unrealised_calc = UnrealisedGainsCalculator()
            positions = unrealised_calc.calculate_unrealised_positions(
                holdings, price_svc, all_transactions
            )

            # 4. Predictive tax
            summary = unrealised_calc.calculate_predictive_tax(
                positions,
                all_transactions,
                tax_year,
                already_realised_gain_gbp=already_realised_gain_gbp,
            )

            # 5. Serialise
            positions_out = [
                {
                    'symbol': p.holding.security.symbol,
                    'name': p.holding.security.name,
                    'quantity': p.holding.quantity,
                    'market': p.holding.market,
                    'price_currency': p.price_currency,
                    'current_price_native': round(p.current_price_native, 4),
                    'current_price_gbp': round(p.current_price_gbp, 4),
                    'fx_rate_to_gbp': round(p.fx_rate_to_gbp, 6),
                    'current_value_gbp': round(p.current_value_gbp, 2),
                    'cost_basis_gbp': round(p.cost_basis_gbp, 2),
                    'unrealised_gain_loss_gbp': round(p.unrealised_gain_loss_gbp, 2),
                    'gain_loss_pct': round(p.gain_loss_pct, 2),
                    'has_recent_buys': p.has_recent_buys,
                    'days_since_last_buy': p.days_since_last_buy,
                    'price_source': p.price_source,
                    'price_fetched_at': (p.price_fetched_at.isoformat()
                                         if p.price_fetched_at else None),
                }
                for p in positions
            ]

            response_body = {
                **summary.get_summary_dict(),
                'positions': positions_out,
                'broker_file': filename,
            }

            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(response_body)
            }

        finally:
            for path in temp_file_paths:
                if os.path.exists(path):
                    try:
                        os.unlink(path)
                    except Exception:
                        pass

    except Exception as exc:
        print(f"Error in /unrealised-gains: {exc}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(exc),
                                'message': 'Error computing unrealised gains'})
        }


def serialize_results(results: Dict[str, Any], calculator=None) -> Dict[str, Any]:

    """Serialize results for JSON response, handling complex types."""
    
    class CustomJSONEncoder(json.JSONEncoder):
        def default(self, obj):
            from decimal import Decimal
            if isinstance(obj, Decimal):
                return float(obj)
            if hasattr(obj, 'to_dict'):
                return obj.to_dict()
            if hasattr(obj, '__dict__'):
                return obj.__dict__
            try:
                return super().default(obj)
            except TypeError:
                return str(obj)

    # Extract disposal events if tax analysis exists
    if 'tax_analysis' in results and results['tax_analysis']:
        tax_analysis = results['tax_analysis']
        if hasattr(tax_analysis, 'capital_gains') and tax_analysis.capital_gains:
            capital_gains = tax_analysis.capital_gains
            if hasattr(capital_gains, 'disposals') and capital_gains.disposals:
                disposal_events = []
                for i, disposal in enumerate(capital_gains.disposals, 1):
                    # Extract disposal event with all tracking fields
                    event = {
                        'disposal_id': str(i),
                        'disposal_date': disposal.sell_date.isoformat() if hasattr(disposal.sell_date, 'isoformat') else str(disposal.sell_date),
                        'security_symbol': disposal.security.symbol if hasattr(disposal, 'security') else '',
                        'security_name': disposal.security.name if hasattr(disposal, 'security') else '',
                        'security_country': getattr(disposal, 'country', None),
                        'quantity': float(disposal.quantity),
                        
                        # Cost breakdown
                        'cost_original_amount': float(getattr(disposal, 'cost_original_amount', 0)),
                        'cost_original_currency': getattr(disposal, 'cost_original_currency', 'GBP'),
                        'cost_fx_rate': float(getattr(disposal, 'cost_fx_rate', 1.0)),
                        'cost_gbp': float(disposal.cost_basis),
                        'cost_commission': float(getattr(disposal, 'cost_commission', 0)),
                        'acquisition_date': disposal.acquisition_date.isoformat() if hasattr(disposal, 'acquisition_date') and disposal.acquisition_date and hasattr(disposal.acquisition_date, 'isoformat') else None,
                        
                        # Proceeds breakdown
                        'proceeds_original_amount': float(getattr(disposal, 'proceeds_original_amount', 0)),
                        'proceeds_original_currency': getattr(disposal, 'proceeds_original_currency', 'GBP'),
                        'proceeds_fx_rate': float(getattr(disposal, 'proceeds_fx_rate', 1.0)),
                        'proceeds_gbp': float(disposal.proceeds),
                        'proceeds_commission': float(getattr(disposal, 'proceeds_commission', 0)),
                        
                        # Tax tracking
                        'withholding_tax': float(getattr(disposal, 'withholding_tax', 0)),
                        'fx_gain_loss': float(getattr(disposal, 'fx_gain_loss', 0)),
                        'cgt_gain_loss': float(getattr(disposal, 'cgt_gain_loss', disposal.gain_or_loss)),
                        'total_gain_loss': float(disposal.gain_or_loss),
                        'matching_rule': getattr(disposal, 'matching_rule', 'section104'),
                        
                        # Calculated properties
                        'allowable_cost': float(getattr(disposal, 'allowable_cost', disposal.cost_basis)),
                        'net_proceeds': float(disposal.proceeds - getattr(disposal, 'proceeds_commission', 0))
                    }
                    disposal_events.append(event)
                
                results['disposal_events'] = disposal_events
    
    # Extract currency pool balances from calculator if available
    if calculator and hasattr(calculator, 'currency_processor'):
        try:
            currency_processor = calculator.currency_processor
            if hasattr(currency_processor, 'get_currency_pool_status'):
                pool_status = currency_processor.get_currency_pool_status()
                if pool_status:
                    currency_balances = []
                    for currency_code, status in pool_status.items():
                        balance = {
                            'currency': currency_code,
                            'balance': float(status.get('total_amount', 0)),
                            'balance_gbp': float(status.get('total_cost_gbp', 0)),
                            'fx_rate': float(status.get('average_rate', 1.0))
                        }
                        currency_balances.append(balance)
                    
                    if currency_balances:
                        results['currency_balances'] = currency_balances
        except Exception as e:
            # Don't fail the entire request if currency balances extraction fails
            print(f"Warning: Could not extract currency balances: {e}")

    # The dumps/loads cycle ensures all nested objects are serialized
    return json.loads(json.dumps(results, cls=CustomJSONEncoder))


def serve_landing_page() -> Dict[str, Any]:
    """Serve the main landing page with ads."""
    from landing_page import get_landing_page_html

    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'text/html',
            'Access-Control-Allow-Origin': '*'
        },
        'body': get_landing_page_html()
    }


def serve_about_page() -> Dict[str, Any]:
    """Serve the about page."""
    from about_page import get_about_page_html

    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'text/html',
            'Access-Control-Allow-Origin': '*'
        },
        'body': get_about_page_html()
    }


def serve_privacy_page() -> Dict[str, Any]:
    """Serve the privacy policy page."""
    from privacy_page import get_privacy_page_html

    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'text/html',
            'Access-Control-Allow-Origin': '*'
        },
        'body': get_privacy_page_html()
    }


def serve_terms_page() -> Dict[str, Any]:
    """Serve the terms of service page."""
    from terms_page import get_terms_page_html

    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'text/html',
            'Access-Control-Allow-Origin': '*'
        },
        'body': get_terms_page_html()
    }


def serve_help_page() -> Dict[str, Any]:
    """Serve the help page."""
    from help_page import get_help_page_html

    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'text/html',
            'Access-Control-Allow-Origin': '*'
        },
        'body': get_help_page_html()
    }


def serve_cgt_guide_page() -> Dict[str, Any]:
    """Serve the CGT guide page."""
    from cgt_guide_page import get_cgt_guide_page_html

    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'text/html',
            'Access-Control-Allow-Origin': '*'
        },
        'body': get_cgt_guide_page_html()
    }


def serve_blog_page() -> Dict[str, Any]:
    """Serve the blog page."""
    from blog_page import get_blog_page_html

    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'text/html',
            'Cache-Control': 'public, max-age=3600'
        },
        'body': get_blog_page_html()
    }


def serve_ads_txt() -> Dict[str, Any]:
    """Serve the ads.txt file for Google AdSense verification."""
    ads_txt_content = "google.com, pub-2934063890442014, DIRECT, f08c47fec0942fa0"

    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'text/plain',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=86400'  # Cache for 24 hours
        },
        'body': ads_txt_content
    }


def generate_results_page(results: Dict[str, Any], tax_year: str) -> str:
    """Generate HTML results page with ads."""
    from results_page import get_results_page_html

    return get_results_page_html(results, tax_year)
