"""
Tests for the web application's temporary file cleanup functionality.
"""
import os
import sys
import tempfile
import unittest
from unittest.mock import patch, MagicMock
from flask import session, appcontext_pushed, appcontext_popped

# Add the project root to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from web_app.app import app as flask_app, cleanup_temp_files


class WebCleanupTestCase(unittest.TestCase):
    """Test case for temporary file cleanup functionality."""
    
    def setUp(self):
        """Set up the test client and environment."""
        self.app = flask_app.test_client()
        self.app.testing = True
        
        # Create a temporary directory for test uploads
        self.temp_dir = tempfile.mkdtemp()
        flask_app.config['UPLOAD_FOLDER'] = self.temp_dir
        
        # Create temporary files to be cleaned up
        self.test_file_path = os.path.join(self.temp_dir, 'test_upload.qfx')
        with open(self.test_file_path, 'w') as f:
            f.write('This is a test file')
            
        self.test_output_path = os.path.join(self.temp_dir, 'test_output.csv')
        with open(self.test_output_path, 'w') as f:
            f.write('This is a test output')
    
    def tearDown(self):
        """Clean up after the tests."""
        # Remove any remaining temporary files
        for filename in os.listdir(self.temp_dir):
            try:
                os.remove(os.path.join(self.temp_dir, filename))
            except:
                pass
        try:
            os.rmdir(self.temp_dir)
        except:
            pass
    
    def test_cleanup_with_request_context(self):
        """Test that files are cleaned up within a request context."""
        with flask_app.test_request_context():
            # Set up session data
            session['file_path'] = self.test_file_path
            session['output_path'] = self.test_output_path
            session.modified = True
            
            # Verify files exist before cleanup
            self.assertTrue(os.path.exists(self.test_file_path))
            self.assertTrue(os.path.exists(self.test_output_path))
            
            # Call cleanup function
            cleanup_temp_files(None)
            
            # Verify files are removed
            self.assertFalse(os.path.exists(self.test_file_path), "File should be removed")
            self.assertFalse(os.path.exists(self.test_output_path), "Output should be removed")
    
    def test_cleanup_outside_request_context(self):
        """Test that cleanup doesn't crash outside request context."""
        # This test checks if cleanup_temp_files can handle being called outside a request context
        
        # First, test direct session access outside request context
        # This should always raise a RuntimeError
        try:
            from flask import session
            print("\nTrying to access session outside request context...")
            if 'file_path' in session:
                print("This should never be reached")
            direct_access_success = True
        except RuntimeError as e:
            print(f"Got expected RuntimeError on direct session access: {str(e)}")
            direct_access_success = False
        
        # Now test the actual cleanup_temp_files function
        # Our fix should prevent this from raising a RuntimeError
        try:
            print("\nCalling cleanup_temp_files outside request context...")
            cleanup_temp_files(None)
            cleanup_success = True
            print("cleanup_temp_files completed without error")
        except RuntimeError as e:
            print(f"Got RuntimeError from cleanup_temp_files: {str(e)}")
            cleanup_success = False
            
        # Direct session access should fail
        self.assertFalse(direct_access_success, "Direct session access outside request context should raise RuntimeError")
        
        # cleanup_temp_files should not fail after our fix
        # Currently this will fail until we implement the fix
        self.assertTrue(cleanup_success, "cleanup_temp_files should not raise RuntimeError outside request context")
    
    def test_missing_files_dont_cause_errors(self):
        """Test that cleanup handles missing files gracefully."""
        with flask_app.test_request_context():
            # Set up session with paths to non-existent files
            session['file_path'] = os.path.join(self.temp_dir, 'nonexistent.qfx')
            session['output_path'] = os.path.join(self.temp_dir, 'nonexistent.csv')
            session.modified = True
            
            # Call cleanup function - should not raise exceptions
            try:
                cleanup_temp_files(None)
                success = True
            except Exception as e:
                success = False
            
            self.assertTrue(success, "Cleanup should handle missing files gracefully")
    
    def test_teardown_appcontext_hook(self):
        """Test that the cleanup function is properly registered as teardown hook."""
        # Verify that cleanup_temp_files is registered as a teardown_appcontext function
        self.assertIn(cleanup_temp_files, flask_app.teardown_appcontext_funcs)


if __name__ == '__main__':
    unittest.main()
