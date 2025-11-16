import React, { useState, useRef } from 'react';
import { BrokerFile, BrokerType, BROKER_OPTIONS } from '../../types/calculator';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';

interface MultiFileUploadProps {
  files: BrokerFile[];
  onChange: (files: BrokerFile[]) => void;
  maxFiles?: number;
  maxSizePerFile?: number; // in bytes
}

const MAX_FILES_DEFAULT = 10;
const MAX_SIZE_PER_FILE_DEFAULT = 10 * 1024 * 1024; // 10MB

export const MultiFileUpload: React.FC<MultiFileUploadProps> = ({
  files,
  onChange,
  maxFiles = MAX_FILES_DEFAULT,
  maxSizePerFile = MAX_SIZE_PER_FILE_DEFAULT
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateId = () => `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const validateFile = (file: File): string | null => {
    const allowedExtensions = ['.csv', '.qfx', '.ofx'];
    const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!allowedExtensions.includes(extension)) {
      return `File "${file.name}" has an invalid format. Only CSV, QFX, and OFX files are accepted.`;
    }
    
    if (file.size > maxSizePerFile) {
      const sizeMB = (maxSizePerFile / (1024 * 1024)).toFixed(0);
      return `File "${file.name}" is too large. Maximum size is ${sizeMB}MB.`;
    }
    
    return null;
  };

  const handleFiles = (newFiles: FileList | null) => {
    if (!newFiles || newFiles.length === 0) return;

    setError(null);

    if (files.length + newFiles.length > maxFiles) {
      setError(`You can only upload up to ${maxFiles} files at a time.`);
      return;
    }

    const brokerFiles: BrokerFile[] = [];
    const errors: string[] = [];

    Array.from(newFiles).forEach((file) => {
      const validationError = validateFile(file);
      if (validationError) {
        errors.push(validationError);
      } else {
        brokerFiles.push({
          id: generateId(),
          file,
          broker: 'interactive-brokers', // default
          accountName: undefined
        });
      }
    });

    if (errors.length > 0) {
      setError(errors.join(' '));
      return;
    }

    onChange([...files, ...brokerFiles]);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleBrokerChange = (fileId: string, broker: BrokerType) => {
    onChange(files.map(f => f.id === fileId ? { ...f, broker } : f));
  };

  const handleAccountNameChange = (fileId: string, accountName: string) => {
    onChange(files.map(f => f.id === fileId ? { ...f, accountName } : f));
  };

  const handleRemove = (fileId: string) => {
    onChange(files.filter(f => f.id !== fileId));
    setError(null);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const totalSize = files.reduce((sum, f) => sum + f.file.size, 0);

  return (
    <div className="multi-file-upload">
      {error && (
        <Alert variant="danger" className="mb-3" onClose={() => setError(null)}>
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
        </Alert>
      )}

      {/* Drop Zone */}
      <div
        className={`border-2 border-dashed rounded p-4 text-center ${
          dragOver ? 'border-primary bg-light' : 'border-secondary'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        style={{ transition: 'all 0.2s ease', cursor: 'pointer' }}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".csv,.qfx,.ofx"
          onChange={handleFileInput}
          style={{ display: 'none' }}
        />
        
        <div className="py-3">
          <i className={`fas fa-cloud-upload-alt ${dragOver ? 'text-primary' : 'text-secondary'} mb-3`} style={{ fontSize: '3rem' }}></i>
          <h5 className="mb-2">
            {dragOver ? 'Drop files here' : 'Drag & drop broker files here'}
          </h5>
          <p className="text-muted mb-2">or click to browse</p>
          <p className="small text-muted mb-0">
            Accepted formats: CSV, QFX, OFX | Max {maxFiles} files | Max {formatFileSize(maxSizePerFile)} per file
          </p>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="mb-0">
              <i className="fas fa-file-alt me-2"></i>
              Uploaded Files ({files.length}/{maxFiles})
            </h6>
            <span className="badge bg-secondary">
              Total: {formatFileSize(totalSize)}
            </span>
          </div>

          <div className="list-group">
            {files.map((brokerFile, index) => (
              <div key={brokerFile.id} className="list-group-item">
                <div className="row g-3 align-items-center">
                  {/* File Info */}
                  <div className="col-12 col-md-4">
                    <div className="d-flex align-items-center">
                      <i className="fas fa-file-csv text-success me-2" style={{ fontSize: '1.5rem' }}></i>
                      <div className="flex-grow-1">
                        <div className="fw-bold text-truncate" style={{ maxWidth: '200px' }}>
                          {brokerFile.file.name}
                        </div>
                        <div className="small text-muted">
                          {formatFileSize(brokerFile.file.size)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Broker Selection */}
                  <div className="col-12 col-md-3">
                    <select
                      className="form-select form-select-sm"
                      value={brokerFile.broker}
                      onChange={(e) => handleBrokerChange(brokerFile.id, e.target.value as BrokerType)}
                    >
                      {BROKER_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Account Name (Optional) */}
                  <div className="col-12 col-md-3">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Account label (optional)"
                      value={brokerFile.accountName || ''}
                      onChange={(e) => handleAccountNameChange(brokerFile.id, e.target.value)}
                    />
                  </div>

                  {/* Remove Button */}
                  <div className="col-12 col-md-2 text-end">
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleRemove(brokerFile.id)}
                    >
                      <i className="fas fa-trash"></i>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-2 text-end">
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => onChange([])}
            >
              <i className="fas fa-times me-2"></i>
              Clear All
            </Button>
          </div>
        </div>
      )}

      {files.length === 0 && (
        <div className="alert alert-info mt-3 mb-0" role="alert">
          <i className="fas fa-info-circle me-2"></i>
          <strong>Tip:</strong> You can upload files from multiple brokers. We'll combine them automatically.
        </div>
      )}
    </div>
  );
};
