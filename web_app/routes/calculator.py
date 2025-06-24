"""Routes for handling asynchronous calculations."""
from flask import Blueprint, request, jsonify, current_app
import os
from werkzeug.utils import secure_filename

from web_app.services.storage_service import StorageService
from web_app.services.calculation_service import CalculationService

# Create blueprint
bp = Blueprint('calculator', __name__)

# Initialize services
storage_service = StorageService()
calculation_service = CalculationService(storage_service)


def allowed_file(filename):
    """Check if the file type is allowed."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in {'csv', 'qfx'}


@bp.route('/calculate', methods=['POST'])
def submit_calculation():
    """Handle file upload and start asynchronous calculation."""
    # Check if file was uploaded
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    # Validate file type
    if not allowed_file(file.filename):
        return jsonify({'error': 'Invalid file type'}), 400
    
    # Validate tax year
    tax_year = request.form.get('tax_year')
    if not tax_year:
        return jsonify({'error': 'Tax year is required'}), 400
    
    try:
        # Save uploaded file
        filename = secure_filename(file.filename)
        file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        
        # Submit calculation task
        task_id = calculation_service.submit_calculation(file_path, tax_year)
        
        return jsonify({
            'task_id': task_id,
            'status': 'accepted'
        }), 202
        
    except Exception as e:
        current_app.logger.error(f"Error processing upload: {str(e)}")
        return jsonify({'error': str(e)}), 500


@bp.route('/task/<task_id>/status', methods=['GET'])
def get_task_status(task_id):
    """Get the status of a calculation task."""
    status = calculation_service.get_task_status(task_id)
    if status:
        return jsonify(status)
    return jsonify({'error': 'Task not found'}), 404


@bp.route('/task/<task_id>/results', methods=['GET'])
def get_task_results(task_id):
    """Get the results of a completed calculation task."""
    results = calculation_service.get_task_results(task_id)
    if results:
        return jsonify(results)
    return jsonify({'error': 'Results not available'}), 404
