"""
AWS Lambda handler for IBKR Tax Calculator API endpoints.
This handler only processes tax calculations - static files are served from S3.
"""
import json
import base64
import tempfile
import os
import traceback
import logging
from typing import Dict, Any, Tuple
from datetime import datetime

# Set up logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Import our application components
import sys
sys.path.append('/opt/python')  # Lambda layer path
sys.path.append('.')
sys.path.append('./main/python')

try:
    from main.python.capital_gains_calculator import create_enhanced_calculator
    from main.python.services.portfolio_report_generator import PortfolioReportGenerator
    IMPORTS_OK = True
    logger.info("Successfully imported calculator modules")
except ImportError as e:
    logger.error(f"Import error: {e}")
    IMPORTS_OK = False


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    AWS Lambda handler for API Gateway requests.
    
    Supported endpoints:
    - POST /calculate - Process tax calculation
    - POST /download-report - Generate and download reports
    - GET /health - Health check
    """
    try:
        # Check if imports worked
        if not IMPORTS_OK:
            return create_error_response(
                500, 
                "Service temporarily unavailable",
                "Failed to import required modules"
            )

        # Log the incoming request
        logger.info(f"Received request: {event.get('httpMethod')} {event.get('path')}")
        
        # Handle CORS preflight requests
        if event.get('httpMethod') == 'OPTIONS':
            return create_cors_response()
        
        # Route the request based on path
        path = event.get('path', '/')
        method = event.get('httpMethod', 'GET')
        
        if path == '/calculate' and method == 'POST':
            return handle_calculate_request(event)
        elif path == '/download-report' and method == 'POST':
            return handle_download_request(event)
        elif path == '/health' and method == 'GET':
            return handle_health_request()
        else:
            return create_error_response(
                404,
                "Not Found",
                f"Endpoint {method} {path} not found"
            )

    except Exception as e:
        logger.error(f"Unhandled error in lambda_handler: {str(e)}")
        logger.error(traceback.format_exc())
        return create_error_response(
            500,
            "Internal Server Error",
            "An unexpected error occurred"
        )


def handle_calculate_request(event: Dict[str, Any]) -> Dict[str, Any]:
    """Handle tax calculation requests."""
    try:
        # Parse the multipart form data
        file_content, form_data = parse_request_body(event)
        
        if not file_content:
            return create_error_response(
                400,
                "Bad Request",
                "No file content provided"
            )
        
        # Extract form parameters
        tax_year = form_data.get('tax_year', '2024-2025')
        analysis_type = form_data.get('analysis_type', 'both')
        filename = form_data.get('filename', 'upload.csv')
        
        logger.info(f"Processing calculation: tax_year={tax_year}, analysis_type={analysis_type}, filename={filename}")
        
        # Determine file type
        file_type = determine_file_type(filename)
        
        # Create temporary file
        temp_file_path = create_temp_file(file_content, file_type)
        
        try:
            # Process the calculation
            calculator = create_enhanced_calculator(file_type)
            results = calculator.calculate_comprehensive_analysis(
                temp_file_path, tax_year, analysis_type
            )
            
            # Serialize and return results
            serialized_results = serialize_calculation_results(results)
            
            logger.info("Calculation completed successfully")
            return create_success_response(serialized_results)
            
        finally:
            # Clean up temporary file
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
                
    except Exception as e:
        logger.error(f"Error in handle_calculate_request: {str(e)}")
        logger.error(traceback.format_exc())
        return create_error_response(
            400,
            "Calculation Failed",
            str(e)
        )


def handle_download_request(event: Dict[str, Any]) -> Dict[str, Any]:
    """Handle report download requests."""
    try:
        # Parse the request
        file_content, form_data = parse_request_body(event)
        
        if not file_content:
            return create_error_response(
                400,
                "Bad Request", 
                "No file content provided"
            )
        
        # Extract parameters
        tax_year = form_data.get('tax_year', '2024-2025')
        report_format = form_data.get('format', 'pdf')
        filename = form_data.get('filename', 'upload.csv')
        
        logger.info(f"Generating {report_format} report for {tax_year}")
        
        # Determine file type and create temp file
        file_type = determine_file_type(filename)
        temp_file_path = create_temp_file(file_content, file_type)
        
        try:
            # Process calculation
            calculator = create_enhanced_calculator(file_type)
            results = calculator.calculate_comprehensive_analysis(
                temp_file_path, tax_year, 'both'  # Always use comprehensive for reports
            )
            
            # Generate report
            if report_format.lower() == 'pdf':
                report_content, content_type = generate_pdf_report(results, tax_year)
                filename_ext = f"tax-report-{tax_year}.pdf"
            else:  # CSV
                report_content, content_type = generate_csv_report(results, tax_year)
                filename_ext = f"tax-report-{tax_year}.csv"
            
            # Return as downloadable file
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': content_type,
                    'Content-Disposition': f'attachment; filename="{filename_ext}"',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
                },
                'body': base64.b64encode(report_content).decode('utf-8'),
                'isBase64Encoded': True
            }
            
        finally:
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
                
    except Exception as e:
        logger.error(f"Error in handle_download_request: {str(e)}")
        return create_error_response(
            400,
            "Report Generation Failed",
            str(e)
        )


def handle_health_request() -> Dict[str, Any]:
    """Handle health check requests."""
    return create_success_response({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'version': '3.0.0',
        'imports_ok': IMPORTS_OK
    })


def parse_request_body(event: Dict[str, Any]) -> Tuple[str, Dict[str, str]]:
    """Parse multipart form data from the request body."""
    try:
        # Get the body
        body = event.get('body', '')
        if event.get('isBase64Encoded', False):
            body = base64.b64decode(body).decode('utf-8')
        
        # Get content type
        headers = event.get('headers', {})
        content_type = headers.get('content-type') or headers.get('Content-Type', '')
        
        if 'multipart/form-data' not in content_type:
            raise ValueError("Expected multipart/form-data content type")
        
        # Extract boundary
        boundary = None
        for part in content_type.split(';'):
            if 'boundary=' in part:
                boundary = part.split('boundary=')[1].strip()
                break
        
        if not boundary:
            raise ValueError("Could not find boundary in content type")
        
        # Parse multipart data
        form_data = {}
        file_content = None
        
        parts = body.split(f'--{boundary}')
        for part in parts:
            if 'Content-Disposition' in part:
                lines = part.strip().split('\n')
                
                # Parse content disposition
                disposition_line = None
                for line in lines:
                    if 'Content-Disposition' in line:
                        disposition_line = line
                        break
                
                if disposition_line:
                    # Extract field name
                    field_name = None
                    filename = None
                    
                    if 'name="' in disposition_line:
                        start = disposition_line.find('name="') + 6
                        end = disposition_line.find('"', start)
                        field_name = disposition_line[start:end]
                    
                    if 'filename="' in disposition_line:
                        start = disposition_line.find('filename="') + 10
                        end = disposition_line.find('"', start)
                        filename = disposition_line[start:end]
                    
                    # Extract content (skip headers)
                    content_start = part.find('\n\n')
                    if content_start != -1:
                        content = part[content_start + 2:].strip()
                        
                        if field_name == 'file' or filename:
                            file_content = content
                            if filename:
                                form_data['filename'] = filename
                        elif field_name:
                            form_data[field_name] = content
        
        return file_content or '', form_data
        
    except Exception as e:
        logger.error(f"Error parsing request body: {str(e)}")
        raise ValueError(f"Invalid multipart data: {str(e)}")


def determine_file_type(filename: str) -> str:
    """Determine file type from filename."""
    filename_lower = filename.lower()
    if filename_lower.endswith(('.qfx', '.ofx')):
        return 'qfx'
    elif filename_lower.endswith('.csv'):
        return 'csv'
    else:
        return 'csv'  # Default to CSV


def create_temp_file(content: str, file_type: str) -> str:
    """Create a temporary file with the given content."""
    suffix = f'.{file_type}'
    with tempfile.NamedTemporaryFile(mode='w', suffix=suffix, delete=False) as temp_file:
        temp_file.write(content)
        return temp_file.name


def serialize_calculation_results(results: Any) -> Dict[str, Any]:
    """Serialize calculation results for JSON response."""
    try:
        if hasattr(results, '__dict__'):
            # Convert object to dict
            result_dict = {}
            for key, value in results.__dict__.items():
                if hasattr(value, '__dict__'):
                    # Nested object
                    result_dict[key] = {k: v for k, v in value.__dict__.items() if not k.startswith('_')}
                elif isinstance(value, (list, tuple)):
                    # List of objects
                    result_dict[key] = []
                    for item in value:
                        if hasattr(item, '__dict__'):
                            result_dict[key].append({k: v for k, v in item.__dict__.items() if not k.startswith('_')})
                        else:
                            result_dict[key].append(item)
                elif not key.startswith('_'):
                    result_dict[key] = value
            return result_dict
        else:
            return results
    except Exception as e:
        logger.error(f"Error serializing results: {str(e)}")
        return {'error': 'Failed to serialize results'}


def generate_pdf_report(results: Any, tax_year: str) -> Tuple[bytes, str]:
    """Generate PDF report (placeholder implementation)."""
    # For now, return a simple text file as PDF generation requires additional libraries
    content = f"Tax Report for {tax_year}\n\nResults: {str(results)}"
    return content.encode('utf-8'), 'application/pdf'


def generate_csv_report(results: Any, tax_year: str) -> Tuple[bytes, str]:
    """Generate CSV report."""
    csv_content = f"Tax Year,{tax_year}\n"
    
    # Add basic data if available
    if hasattr(results, 'capital_gains_summary'):
        cg = results.capital_gains_summary
        csv_content += f"Total Gains,{getattr(cg, 'total_gains', 0)}\n"
        csv_content += f"Total Losses,{getattr(cg, 'total_losses', 0)}\n"
        csv_content += f"Net Gains,{getattr(cg, 'net_gains', 0)}\n"
    
    return csv_content.encode('utf-8'), 'text/csv'


def create_success_response(data: Dict[str, Any]) -> Dict[str, Any]:
    """Create a successful JSON response."""
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
        },
        'body': json.dumps(data, default=str)
    }


def create_error_response(status_code: int, error: str, message: str = None) -> Dict[str, Any]:
    """Create an error JSON response."""
    response_body = {'error': error}
    if message:
        response_body['message'] = message
    
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
        },
        'body': json.dumps(response_body)
    }


def create_cors_response() -> Dict[str, Any]:
    """Create a CORS preflight response."""
    return {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Max-Age': '86400'
        },
        'body': ''
    }
