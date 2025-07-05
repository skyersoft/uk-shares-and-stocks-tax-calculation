"""
Web application for UK Capital Gains Tax Calculator.
This module provides a Flask-based web interface for the capital gains calculator.
"""
import os
import sys
import logging
import tempfile
import uuid
from pathlib import Path
from datetime import datetime

from flask import Flask, render_template, request, redirect, url_for, flash, session, send_file, jsonify, has_request_context
from flask_wtf import CSRFProtect
from werkzeug.utils import secure_filename

from src.main.python.calculator import CapitalGainsTaxCalculator
from web_app.services.storage_service import StorageService
from web_app.services.calculation_service import CalculationService
from web_app.routes import init_routes
from web_app.forms import UploadForm

def create_app(config=None, storage_service=None, calculation_service=None, testing=False):
    """Create and configure the Flask application with dependency injection."""
    app = Flask(__name__)
    
    # Basic configuration
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', str(uuid.uuid4()))
    app.config['UPLOAD_FOLDER'] = tempfile.mkdtemp()
    app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max upload size

    # Apply additional config if provided
    if config:
        app.config.update(config)

    # Configure testing environment if needed
    if testing or app.config.get('TESTING', False):
        app.config['TESTING'] = True
        app.config['WTF_CSRF_ENABLED'] = False

    # Initialize CSRF protection only if not disabled
    if app.config.get('WTF_CSRF_ENABLED', True):
        csrf = CSRFProtect(app)

    # Initialize services if not provided (for production use)
    if storage_service is None:
        storage_service = StorageService()
    
    if calculation_service is None:
        # Create a calculator factory that can handle both file types
        from src.main.python.parsers.csv_parser import CsvParser
        from src.main.python.parsers.qfx_parser import QfxParser
        
        # Create a multi-format calculator that supports both CSV and QFX
        class MultiFormatCalculator(CapitalGainsTaxCalculator):
            def __init__(self, tax_year_calculator=None):
                # Initialize parsers
                self.csv_parser = CsvParser()
                self.qfx_parser = QfxParser()
                
                # Initialize with QFX parser as default for backward compatibility
                super().__init__(
                    file_parser=self.qfx_parser,
                    tax_year_calculator=tax_year_calculator
                )
            
            def calculate(self, file_path, tax_year, output_path, report_format="csv", file_type="qfx"):
                # Switch parser based on file type
                if file_type == 'csv':
                    original_parser = self.file_parser
                    self.file_parser = self.csv_parser
                    try:
                        return super().calculate(file_path, tax_year, output_path, report_format, file_type)
                    finally:
                        self.file_parser = original_parser
                else:
                    return super().calculate(file_path, tax_year, output_path, report_format, file_type)
        
        # Initialize calculators with required dependencies
        from src.main.python.services.transaction_matcher import UKTransactionMatcher
        from src.main.python.services.disposal_calculator import UKDisposalCalculator
        from src.main.python.services.dividend_processor import DividendProcessor
        from src.main.python.services.currency_processor import CurrencyExchangeProcessor
        from src.main.python.services.tax_year_calculator import EnhancedTaxYearCalculator

        # Create dependencies
        transaction_matcher = UKTransactionMatcher()
        disposal_calculator = UKDisposalCalculator()
        dividend_processor = DividendProcessor()
        currency_processor = CurrencyExchangeProcessor()

        # Create tax year calculator with all dependencies
        tax_year_calculator = EnhancedTaxYearCalculator(
            disposal_calculator=disposal_calculator,
            dividend_processor=dividend_processor,
            currency_processor=currency_processor,
            transaction_matcher=transaction_matcher
        )

        calculator = MultiFormatCalculator(tax_year_calculator=tax_year_calculator)
        calculation_service = CalculationService(storage_service, calculator)

    # Initialize and register routes blueprint with injected services
    routes_bp = init_routes(storage_service, calculation_service)
    app.register_blueprint(routes_bp)


    @app.errorhandler(404)
    def page_not_found(e):
        """404 error handler."""
        return render_template('404.html'), 404

    @app.errorhandler(500)
    def internal_error(e):
        """500 error handler."""
        return render_template('500.html'), 500

    @app.context_processor
    def inject_tax_years():
        """Inject tax years into template context."""
        current_year = datetime.now().year
        tax_years = []
        for year in range(current_year - 5, current_year + 2):
            tax_years.append(f"{year}-{year+1}")
        return dict(tax_years=tax_years)

    def _get_tax_year_choices():
        """Get available tax year choices."""
        return [(year, year) for year in inject_tax_years()['tax_years']]

    def _get_file_type(filename):
        """Determine file type from filename."""
        return 'csv' if filename.lower().endswith('.csv') else 'qfx'

    app.cleanup_temp_files = cleanup_temp_files
    app.update_config_for_testing = lambda: update_app_config_for_testing(app)

    # Register cleanup function as teardown hook
    app.teardown_appcontext(cleanup_temp_files)

    return app

def update_app_config_for_testing(test_app):
    """Update Flask app configuration for testing."""
    test_app.config['TESTING'] = True
    test_app.config['WTF_CSRF_ENABLED'] = False
    test_app.config['UPLOAD_FOLDER'] = tempfile.mkdtemp()
    return test_app

def cleanup_temp_files(error=None):
    """Clean up temporary files."""
    if has_request_context():
        if 'file_path' in session:
            file_path = session['file_path']
            if os.path.exists(file_path):
                try:
                    os.remove(file_path)
                except (OSError, IOError):
                    pass
            session.pop('file_path', None)

        if 'output_path' in session:
            output_path = session['output_path']
            if os.path.exists(output_path):
                try:
                    os.remove(output_path)
                except (OSError, IOError):
                    pass
            session.pop('output_path', None)


# Create the Flask application instance for tests and direct usage
app = create_app()

# Only start the server if running directly
if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    app.run(debug=True, host='0.0.0.0', port=5000)
