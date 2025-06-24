"""
Test specifically for the RuntimeError issue when accessing session outside request context.
"""
import os
import sys
import unittest
import pytest
from flask import session, Flask

# Add the project root to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from web_app.app import cleanup_temp_files


class TestSessionAccessError(unittest.TestCase):
    """Test specifically for session access errors."""
    
    def test_direct_session_access_error(self):
        """
        Test that directly accessing session outside a request context raises a RuntimeError.
        
        This test verifies the issue we're seeing in production - that the cleanup_temp_files
        function tries to access session outside a request context, which raises a RuntimeError.
        """
        # Create a minimal Flask app for testing
        app = Flask('test_app')
        
        # Define a function that tries to access the session
        def access_session():
            if 'file_path' in session:
                return True
            return False
        
        # Register it as a teardown function
        app.teardown_appcontext(access_session)
        
        # Call it directly without a request context - should raise RuntimeError
        with pytest.raises(RuntimeError) as excinfo:
            access_session()
        
        # Verify the error message
        assert "Working outside of request context" in str(excinfo.value)
        
    def test_cleanup_temp_files_handles_request_context(self):
        """
        Test that the cleanup_temp_files function correctly checks for request context.
        
        This test verifies that the fix has been implemented correctly - the function
        should check for a request context before accessing the session.
        """
        # Call cleanup_temp_files directly without a request context
        # It should NOT raise a RuntimeError because it checks for request context first
        try:
            cleanup_temp_files(None)
            success = True
        except RuntimeError:
            success = False
        
        # This should pass because the function is correctly implemented
        self.assertTrue(success, "cleanup_temp_files should not raise RuntimeError outside request context")


if __name__ == '__main__':
    unittest.main()
