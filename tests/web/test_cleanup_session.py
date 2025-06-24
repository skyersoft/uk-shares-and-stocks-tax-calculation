#!/usr/bin/env python
"""
Test for flask session access bug fix.
"""
import os
import sys
import unittest
from unittest.mock import patch, MagicMock

# Add the project root to the Python path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from web_app.app import app, cleanup_temp_files, update_app_config_for_testing


class CleanupTempFilesTestCase(unittest.TestCase):
    """Test case for the cleanup_temp_files function."""
    
    def setUp(self):
        """Set up the test."""
        # Configure the app for testing
        self.app = update_app_config_for_testing(app).test_client()
    
    @patch('os.path.exists')
    @patch('os.remove')
    def test_cleanup_outside_request_context(self, mock_remove, mock_exists):
        """Test cleanup_temp_files when outside of a request context."""
        # Use app context but no request context
        with self.app.application.app_context():
            # Call the function
            cleanup_temp_files(None)
            
            # No files should be checked or removed
            mock_exists.assert_not_called()
            mock_remove.assert_not_called()
    
    @patch('os.path.exists')
    @patch('os.remove')
    def test_cleanup_inside_request_context(self, mock_remove, mock_exists):
        """Test cleanup_temp_files when inside a request context with file paths in session."""
        # Create test paths
        test_file_path = "/tmp/test_file"
        test_output_path = "/tmp/test_output"
        
        # Use test request context
        with self.app.application.test_request_context():
            # Set up session data
            from flask import session
            session['file_path'] = test_file_path
            session['output_path'] = test_output_path
            
            # Simulate files exist
            mock_exists.return_value = True
            
            # Call the function
            cleanup_temp_files(None)
            
            # Check that both files were checked and removed
            self.assertEqual(mock_exists.call_count, 2)
            self.assertEqual(mock_remove.call_count, 2)


if __name__ == '__main__':
    unittest.main()
