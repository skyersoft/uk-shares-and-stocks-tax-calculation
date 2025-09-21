import React, { useState, useRef } from 'react';
import { Alert } from './Alert';
import { LoadingSpinner } from './LoadingSpinner';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number;
  className?: string;
  disabled?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ 
  onFileSelect, 
  accept = '.csv,.qfx,.ofx',
  maxSize = 10 * 1024 * 1024, // 10MB
  className = '',
  disabled = false
}) => {
  const [dragOver, setDragOver] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    // Check file type
    const validExtensions = accept.split(',').map(ext => ext.trim().toLowerCase());
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
      throw new Error(`Invalid file type. Only ${validExtensions.join(', ')} files are supported.`);
    }

    // Check file size
    if (file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024));
      throw new Error(`File too large. Maximum file size is ${maxSizeMB}MB.`);
    }

    return true;
  };

  const handleFileSelect = async (file: File): Promise<void> => {
    if (!file) return;

    try {
      setUploadError(null);
      setUploading(true);
      
      validateFile(file);
      
      // Simulate upload delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500));
      
      onFileSelect(file);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setUploadError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    if (!disabled) {
      setDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    setDragOver(false);
    
    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleClick = (): void => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className={className}>
      {/* Upload Area */}
      <div
        className={`upload-area ${dragOver ? 'drag-over' : ''} ${disabled ? 'disabled' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        style={{
          border: `2px dashed ${dragOver ? '#0056b3' : '#007bff'}`,
          borderRadius: '10px',
          padding: '32px 16px',
          background: dragOver ? '#e9f2ff' : '#f4f8ff',
          transition: 'border-color 0.2s, background-color 0.2s',
          cursor: disabled ? 'not-allowed' : 'pointer',
          textAlign: 'center',
          opacity: disabled ? 0.6 : 1
        }}
      >
        {uploading ? (
          <div>
            <LoadingSpinner size="lg" className="text-primary mb-3" />
            <h5>Uploading file...</h5>
            <p className="text-muted">Please wait while we process your file</p>
          </div>
        ) : (
          <div>
            <i 
              className="fas fa-cloud-upload-alt fa-3x text-primary mb-3" 
              aria-label="Upload IBKR file"
            />
            <h5>Drag & Drop your CSV or QFX file here</h5>
            <p className="text-muted">or click to browse</p>
            <small className="text-muted">
              Supported formats: {accept} • Max size: {Math.round(maxSize / (1024 * 1024))}MB
            </small>
          </div>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        disabled={disabled || uploading}
        style={{ display: 'none' }}
        aria-label="Upload IBKR transaction file"
      />

      {/* Upload Error */}
      {uploadError && (
        <Alert 
          variant="danger" 
          className="mt-3"
          dismissible
          onDismiss={() => setUploadError(null)}
        >
          <strong>Upload Error:</strong> {uploadError}
        </Alert>
      )}
    </div>
  );
};

export default FileUpload;