"""AWS Lambda handler for IBKR Tax Calculator web application."""
import json
import base64
import tempfile
import os
from typing import Dict, Any
from io import StringIO

# Import our application components
import sys
sys.path.append('/opt/python')  # Lambda layer path
sys.path.append('.')
sys.path.append('./main/python')  # Add the main/python directory to path

try:
    # In Lambda, the files are at root level after packaging
    from main.python.capital_gains_calculator import create_enhanced_calculator
    from main.python.services.portfolio_report_generator import PortfolioReportGenerator
    from main.python.parsers.csv_parser import CSVValidationError, REQUIRED_CSV_COLUMNS
    IMPORTS_OK = True
except ImportError as e:
    print(f"Import error: {e}")
    IMPORTS_OK = False
    # Fallback - we'll handle this in the handler
    CSVValidationError = None
    REQUIRED_CSV_COLUMNS = []


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    AWS Lambda handler for processing tax calculation requests.

    Supports both API Gateway and direct invocation.
    """
    try:
        # Check if imports worked
        if not IMPORTS_OK:
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'text/html',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': '<h1>Import Error</h1><p>Failed to import required modules</p>'
            }

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

    # Handle file upload and processing
    elif method == 'POST' and (path == '/calculate' or path == '/'):
        return handle_calculation_request(event)
    
    # 404 for unknown paths
    return {
        'statusCode': 404,
        'headers': {
            'Content-Type': 'text/html',
            'Access-Control-Allow-Origin': '*'
        },
        'body': '<h1>404 - Page Not Found</h1>'
    }


def handle_calculation_request(event: Dict[str, Any]) -> Dict[str, Any]:
    """Handle tax calculation request with file upload."""

    try:
        # Parse request body
        if event.get('isBase64Encoded', False):
            body = base64.b64decode(event['body'])
        else:
            body = event['body'].encode('utf-8') if isinstance(event['body'], str) else event['body']

        # Parse multipart form data
        content_type = event.get('headers', {}).get('content-type', '') or event.get('headers', {}).get('Content-Type', '')

        if 'multipart/form-data' in content_type:
            # Extract file content and parameters from multipart data
            file_content, tax_year, analysis_type, filename = parse_multipart_data_proper(body, content_type)
            print(f"Parsed multipart data: file_content length={len(file_content)}, tax_year={tax_year}, analysis_type={analysis_type}, filename={filename}")
            if file_content:
                print(f"File content preview: {file_content[:200]}...")
            else:
                print("WARNING: No file content received!")
        else:
            # JSON request (fallback)
            try:
                data = json.loads(body.decode('utf-8') if isinstance(body, bytes) else body)
                file_content = data.get('file_content', '')
                tax_year = data.get('tax_year', '2024-2025')
                analysis_type = data.get('analysis_type', 'both')
                filename = data.get('filename', '')
            except:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'text/html',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': '<h1>Error</h1><p>Invalid request format. Please use the web form to upload files.</p>'
                }

        # Determine file type from filename
        file_type = "csv"  # default
        if filename:
            if filename.lower().endswith(('.qfx', '.ofx')):
                file_type = "qfx"
            elif filename.lower().endswith('.csv'):
                file_type = "csv"

        # Create temporary file with correct extension
        file_suffix = f'.{file_type}'
        with tempfile.NamedTemporaryFile(mode='w', suffix=file_suffix, delete=False) as temp_file:
            temp_file.write(file_content)
            temp_file_path = temp_file.name

        try:
            # Process the file with correct parser
            calculator = create_enhanced_calculator(file_type)
            print(f"Using {file_type} parser for file: {filename}")
            results = calculator.calculate_comprehensive_analysis(
                temp_file_path, tax_year, analysis_type
            )
            
            # Serialize results to JSON
            # This is the main fix: returning JSON instead of HTML
            json_results = serialize_results(results)
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps(json_results)
            }
        
        except CSVValidationError as e:
            # Handle CSV validation errors
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'Invalid CSV format',
                    'message': 'Missing required columns',
                    'missing_columns': e.missing_columns,
                    'required_columns': REQUIRED_CSV_COLUMNS
                })
            }
            
        finally:
            # Clean up temporary file
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
    
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

        file_content = ""
        filename = ""
        tax_year = "2024-2025"
        analysis_type = "both"

        for part in parts:
            name = part.name
            if name == 'file':
                file_content = part.raw.decode('utf-8')
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
            elif name == 'tax_year':
                tax_year = part.value
            elif name == 'analysis_type':
                analysis_type = part.value

        return file_content, tax_year, analysis_type, filename

    except Exception:
        # Fallback to simple parsing if multipart library fails
        body_str = body.decode('utf-8', errors='ignore')
        return parse_multipart_data_simple(body_str)


def parse_multipart_data_simple(body: str) -> tuple:
    """Parse multipart form data (simplified implementation)."""
    # This is a basic implementation - fallback method
    lines = body.split('\n')
    file_content = ""
    filename = ""
    tax_year = "2024-2025"
    analysis_type = "both"

    # Extract form fields and file content
    in_file = False
    current_field = None

    for i, line in enumerate(lines):
        if 'name="file"' in line:
            in_file = True
            current_field = 'file'
            # Extract filename from Content-Disposition
            if 'filename=' in line:
                import re
                pattern = r'filename="?([^"]+)"?'
                match = re.search(pattern, line)
                if match:
                    filename = match.group(1)
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
            current_field = None
            in_file = False
            continue
        elif current_field == 'file' and in_file and line.strip() and not line.startswith('Content-'):
            file_content += line + '\n'
        elif current_field == 'tax_year' and line.strip() and not line.startswith('Content-'):
            tax_year = line.strip()
            current_field = None
        elif current_field == 'analysis_type' and line.strip() and not line.startswith('Content-'):
            analysis_type = line.strip()
            current_field = None

    return file_content.strip(), tax_year, analysis_type, filename


def serialize_results(results: Dict[str, Any]) -> Dict[str, Any]:
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
                        'cost_original_currency': getattr(disposal, 'cost_currency', 'GBP'),
                        'cost_fx_rate': float(getattr(disposal, 'cost_fx_rate', 1.0)),
                        'cost_gbp': float(disposal.cost_basis),
                        'cost_commission': float(getattr(disposal, 'cost_commission', 0)),
                        'acquisition_date': disposal.acquisition_date.isoformat() if hasattr(disposal, 'acquisition_date') and disposal.acquisition_date and hasattr(disposal.acquisition_date, 'isoformat') else None,
                        
                        # Proceeds breakdown
                        'proceeds_original_amount': float(getattr(disposal, 'proceeds_original_amount', 0)),
                        'proceeds_original_currency': getattr(disposal, 'proceeds_currency', 'GBP'),
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
