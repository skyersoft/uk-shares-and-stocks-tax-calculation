"""Service for managing temporary file storage."""
import os
import uuid
import shutil
from datetime import datetime, timedelta
from typing import BinaryIO
from werkzeug.utils import secure_filename


class StorageService:
    """Service for managing temporary file storage and cleanup."""
    
    def __init__(self, base_path: str = None, max_age_hours: int = 24):
        """Initialize the storage service.
        
        Args:
            base_path: Base directory for temporary files
            max_age_hours: Maximum age of files before cleanup (default: 24 hours)
        """
        self.base_path = base_path or os.path.join(os.getcwd(), 'uploads')
        self.max_age_hours = max_age_hours
        os.makedirs(self.base_path, exist_ok=True)
    
    def save_file(self, file: BinaryIO, original_filename: str) -> str:
        """Save an uploaded file and return a unique identifier.
        
        Args:
            file: File-like object containing the uploaded file
            original_filename: Original name of the uploaded file
        
        Returns:
            str: Unique identifier for the file
        """
        # Generate unique ID
        file_id = str(uuid.uuid4())
        
        # Get secure version of original filename and extension
        filename = secure_filename(original_filename)
        _, ext = os.path.splitext(filename)
        
        # Create final filename with ID
        final_filename = f"{file_id}{ext}"
        file_path = os.path.join(self.base_path, final_filename)
        
        # Save the file
        file.seek(0)  # Ensure we're at the start of the file
        with open(file_path, 'wb') as f:
            shutil.copyfileobj(file, f)
        
        return file_id

    def get_file_path(self, file_id: str) -> str:
        """Get the full path for a file by its ID.
        
        Args:
            file_id: Unique identifier of the file
        
        Returns:
            str: Full path to the file
            
        Raises:
            FileNotFoundError: If no file exists with the given ID
        """
        # Find file with matching ID prefix
        for filename in os.listdir(self.base_path):
            if filename.startswith(file_id):
                return os.path.join(self.base_path, filename)
        raise FileNotFoundError(f"No file found with ID: {file_id}")
    
    def cleanup_old_files(self):
        """Remove files older than max_age_hours."""
        cutoff_time = datetime.now() - timedelta(hours=self.max_age_hours)
        
        for filename in os.listdir(self.base_path):
            file_path = os.path.join(self.base_path, filename)
            if os.path.isfile(file_path):
                modified_time = datetime.fromtimestamp(os.path.getmtime(file_path))
                if modified_time < cutoff_time:
                    try:
                        os.remove(file_path)
                    except OSError:
                        pass  # Ignore errors during cleanup
    
    def __del__(self):
        """Clean up temporary files when the service is destroyed."""
        try:
            self.cleanup_old_files()
        except Exception:
            pass  # Ignore cleanup errors during destruction
