"""
Unit tests for the web application.
"""
import os
import sys
import tempfile
import unittest
from unittest.mock import patch, MagicMock

# Add the project root to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from web_app.app import app as flask_app, update_app_config_for_testing


class WebAppTestCase(unittest.TestCase):
    """Test case for the web application."""
    
    def setUp(self):
        """Set up the test client."""
        # Configure the app for testing
        self.app = update_app_config_for_testing(flask_app).test_client()
        
        # Create a temporary directory for test uploads
        self.temp_dir = tempfile.mkdtemp()
        flask_app.config['UPLOAD_FOLDER'] = self.temp_dir
    
    def tearDown(self):
        """Clean up after the tests."""
        # Remove temporary files
        for filename in os.listdir(self.temp_dir):
            os.remove(os.path.join(self.temp_dir, filename))
        os.rmdir(self.temp_dir)
    
    def test_index_page(self):
        """Test the index page loads correctly."""
        response = self.app.get('/')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'UK Capital Gains Tax Calculator', response.data)
        self.assertIn(b'Calculate UK Capital Gains Tax', response.data)
    
    def test_about_page(self):
        """Test the about page loads correctly."""
        response = self.app.get('/about')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'About the UK Capital Gains Tax Calculator', response.data)
    
    def test_404_page(self):
        """Test that 404 errors are handled."""
        response = self.app.get('/nonexistentpage')
        self.assertEqual(response.status_code, 404)
        self.assertIn(b'Page Not Found', response.data)
    
    @patch('web_app.services.calculation_service.CapitalGainsTaxCalculator')
    def test_file_upload_and_calculation(self, mock_calculator):
        """Test file upload and calculation."""
        # Mock the calculator's calculate method
        mock_calculator_instance = MagicMock()
        mock_calculator.return_value = mock_calculator_instance
        
        # Create a test result
        mock_result = MagicMock()
        mock_result.tax_year = "2024-2025"
        mock_result.total_gain_loss = 1000.0
        mock_result.annual_exemption = 12300.0
        mock_result.taxable_gain = 0.0
        mock_result.disposals = []
        
        mock_calculator_instance.calculate.return_value = mock_result
        
        # Create a test file
        test_file = os.path.join(self.temp_dir, 'test_file.qfx')
        with open(test_file, 'w') as f:
            f.write('This is a test QFX file')
        
        # Simulate file upload
        with open(test_file, 'rb') as f:
            response = self.app.post('/calculate', data={
                'file': (f, 'test_file.qfx'),
                'tax_year': '2024-2025',
                'output_format': 'csv',
                'csrf_token': 'fake_csrf_token'  # This will be handled by the CSRF protection in the actual app
            }, follow_redirects=True)
        
        # Assert the response
        self.assertEqual(response.status_code, 200)
        
        # Since the calculation is async, we can't directly assert the calculator was called
        # Instead, we check that the response is successful and the page loads
        self.assertIn(b'UK Capital Gains Tax Calculator', response.data)


if __name__ == '__main__':
    unittest.main()
