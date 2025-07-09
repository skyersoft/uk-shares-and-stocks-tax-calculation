"""
Routes for the UK Capital Gains Tax Calculator web application.
"""
from datetime import datetime
import logging
import os
from pathlib import Path
from flask import Blueprint, render_template, request, redirect, url_for, flash, session, jsonify, send_file, current_app
from werkzeug.utils import secure_filename
from .forms import UploadForm

def init_routes(storage_service, calculation_service):
    """Initialize routes with injected services."""
    # Create a fresh blueprint for each app instance to avoid conflicts
    bp = Blueprint('main', __name__)
    
    @bp.route('/')
    def index():
        """Home page with file upload form."""
        form = UploadForm()
        form.tax_year.choices = _get_tax_year_choices()
        return render_template('index.html', form=form)

    @bp.route('/about')
    def about():
        """About page."""
        return render_template('about.html')

    @bp.route('/calculate', methods=['POST'])
    def calculate():
        """Handle synchronous calculation requests."""
        form = UploadForm()
        form.tax_year.choices = _get_tax_year_choices()

        if not form.validate_on_submit():
            flash('Please correct the errors in the form.', 'error')
            return redirect(url_for('main.index'))

        try:
            file = form.file.data
            filename = secure_filename(file.filename)
            upload_folder = current_app.config['UPLOAD_FOLDER']
            file_path = os.path.join(upload_folder, filename)
            file.save(file_path)
            session['file_path'] = file_path

            task_id = calculation_service.start_calculation(
                file_id=file_path,
                tax_year=form.tax_year.data,
                file_type=_get_file_type(filename)
            )

            # Wait for calculation to complete and get results
            import time
            max_wait = 30  # Maximum wait time in seconds
            wait_time = 0
            
            while wait_time < max_wait:
                status = calculation_service.get_calculation_status(task_id)
                if status == 'completed':
                    results = calculation_service.get_calculation_result(task_id)
                    if results:
                        # Store results in session for download
                        session['results'] = results
                        session['tax_year'] = form.tax_year.data
                        session['output_format'] = 'csv'  # Default format
                        
                        # Render results template
                        import json
                        print(json.dumps(results, indent=2))
                        return render_template('results.html', 
                                             results=results, 
                                             tax_year=form.tax_year.data,
                                             output_format='csv')
                elif status == 'failed':
                    error = calculation_service.get_calculation_error(task_id)
                    flash(f"Calculation failed: {error or 'Unknown error'}", 'error')
                    return redirect(url_for('main.index'))
                
                time.sleep(1)
                wait_time += 1
            
            # If we get here, calculation timed out
            flash('Calculation is taking longer than expected. Please try again.', 'warning')
            return redirect(url_for('main.index'))

        except Exception as e:
            logging.error(f"Error in calculation: {e}", exc_info=True)
            flash(f"Error processing file: {str(e)}", 'error')
            return redirect(url_for('main.index'))

    @bp.route('/download')
    def download():
        """Download the generated report file."""
        if 'output_path' not in session:
            flash('No report available for download. Please calculate first.', 'error')
            return redirect(url_for('main.index'))
        
        try:
            output_path = session['output_path']
            tax_year = session['tax_year']
            output_format = session['output_format']
            
            download_name = f"tax_report_{tax_year}.{output_format}"
            
            return send_file(
                output_path,
                as_attachment=True,
                download_name=download_name,
                mimetype='text/csv' if output_format == 'csv' else 'application/json'
            )
            
        except Exception as e:
            logging.error(f"Error downloading file: {e}", exc_info=True)
            flash(f"Error downloading file: {str(e)}", 'error')
            return redirect(url_for('main.index'))

    @bp.route('/async_calculate', methods=['POST'])
    def async_calculate():
        """Handle asynchronous calculation requests."""
        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400
        
        file = request.files['file']
        tax_year = request.form.get('tax_year')
        output_format = request.form.get('output_format', 'csv')
        
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400
        
        try:
            filename = secure_filename(file.filename)
            file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
            file.save(file_path)
            
            task_id = calculation_service.start_calculation(
                file_id=file_path,
                tax_year=tax_year,
                file_type=_get_file_type(filename)
            )
            
            return jsonify({
                'task_id': task_id,
                'status': calculation_service.get_calculation_status(task_id)
            }), 200
            
        except Exception as e:
            logging.error(f"Error in async calculation: {e}", exc_info=True)
            return jsonify({'error': str(e)}), 500

    @bp.route('/calculation_status/<task_id>', methods=['GET'])
    def calculation_status(task_id):
        """Check the status of an asynchronous calculation."""
        try:
            status = calculation_service.get_calculation_status(task_id)
            return jsonify(status), 200
        
        except Exception as e:
            logging.error(f"Error fetching calculation status: {e}", exc_info=True)
            return jsonify({'error': str(e)}), 500

    @bp.route('/api/calculate', methods=['POST'])
    def submit_calculation():
        """Handle file upload and start asynchronous calculation."""
        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Validate file type
        if not _allowed_file(file.filename):
            return jsonify({'error': 'Invalid file type'}), 400
        
        # Validate tax year
        tax_year = request.form.get('tax_year')
        if not tax_year:
            return jsonify({'error': 'Tax year is required'}), 400
        
        try:
            filename = secure_filename(file.filename)
            file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
            file.save(file_path)
            
            task_id = calculation_service.submit_calculation(
                file_path=file_path,
                tax_year=tax_year
            )
            
            return jsonify({
                'task_id': task_id,
                'status': 'accepted'
            }), 202
            
        except Exception as e:
            current_app.logger.error(f"Error processing upload: {str(e)}")
            return jsonify({'error': str(e)}), 500

    @bp.route('/api/task/<task_id>/status', methods=['GET'])
    def get_task_status(task_id):
        """Get the status of a calculation task."""
        status = calculation_service.get_task_status(task_id)
        if status:
            return jsonify(status)
        return jsonify({'error': 'Task not found'}), 404

    @bp.route('/api/task/<task_id>/results', methods=['GET'])
    def get_task_results(task_id):
        """Get the results of a completed calculation task."""
        results = calculation_service.get_task_results(task_id)
        if results:
            return jsonify(results)
        return jsonify({'error': 'Results not available'}), 404

    @bp.errorhandler(404)
    def page_not_found(e):
        """404 error handler."""
        return render_template('404.html'), 404

    @bp.errorhandler(500)
    def internal_error(e):
        """500 error handler."""
        return render_template('500.html'), 500

    @bp.context_processor
    def inject_tax_years():
        """Inject tax years into template context."""
        current_year = datetime.now().year
        tax_years = []
        for year in range(current_year - 5, current_year + 2):
            tax_years.append(f"{year}-{year+1}")
        return dict(tax_years=tax_years)

    return bp

def _get_tax_year_choices():
    """Get available tax year choices."""
    current_year = datetime.now().year
    choices = []
    for year in range(current_year - 5, current_year + 2):
        tax_year = f"{year}-{year+1}"
        choices.append((tax_year, tax_year))
    return choices

def _get_file_type(filename):
    """Determine file type from filename."""
    return 'csv' if filename.lower().endswith('.csv') else 'qfx'

def _allowed_file(filename):
    """Check if the file type is allowed."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in {'csv', 'qfx'}
