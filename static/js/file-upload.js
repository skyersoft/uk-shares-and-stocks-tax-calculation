/**
 * File upload handling for IBKR Tax Calculator
 * Provides advanced file upload functionality with progress tracking
 */

class FileUploadHandler {
    constructor(options = {}) {
        this.options = {
            maxFileSize: 16 * 1024 * 1024, // 16MB
            allowedTypes: ['.csv', '.qfx', '.ofx'],
            uploadUrl: '/api/v1/calculate',
            ...options
        };
        
        this.currentFile = null;
        this.uploadProgress = 0;
        this.isUploading = false;
    }

    /**
     * Initialize file upload with drag and drop
     */
    init(uploadAreaId, fileInputId) {
        this.uploadArea = document.getElementById(uploadAreaId);
        this.fileInput = document.getElementById(fileInputId);
        
        if (!this.uploadArea || !this.fileInput) {
            throw new Error('Upload area or file input not found');
        }
        
        this.attachEventListeners();
    }

    /**
     * Attach all event listeners
     */
    attachEventListeners() {
        // Upload area click
        this.uploadArea.addEventListener('click', (e) => {
            e.preventDefault();
            this.fileInput.click();
        });

        // Drag and drop events
        this.uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
        this.uploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
        this.uploadArea.addEventListener('drop', this.handleDrop.bind(this));

        // File input change
        this.fileInput.addEventListener('change', this.handleFileInputChange.bind(this));

        // Prevent default drag behaviors on document
        document.addEventListener('dragover', (e) => e.preventDefault());
        document.addEventListener('drop', (e) => e.preventDefault());
    }

    /**
     * Handle drag over event
     */
    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        this.uploadArea.classList.add('dragover');
        e.dataTransfer.dropEffect = 'copy';
    }

    /**
     * Handle drag leave event
     */
    handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        this.uploadArea.classList.remove('dragover');
    }

    /**
     * Handle file drop
     */
    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        this.uploadArea.classList.remove('dragover');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.handleFile(files[0]);
        }
    }

    /**
     * Handle file input change
     */
    handleFileInputChange(e) {
        if (e.target.files.length > 0) {
            this.handleFile(e.target.files[0]);
        }
    }

    /**
     * Process and validate file
     */
    handleFile(file) {
        console.log('Processing file:', file.name, file.size, file.type);

        // Validate file
        const validation = this.validateFile(file);
        if (!validation.valid) {
            this.showError(validation.error);
            return;
        }

        // Store file
        this.currentFile = file;

        // Update file input
        this.updateFileInput(file);

        // Update UI
        this.updateUploadAreaUI(file);

        // Trigger custom event
        this.dispatchFileSelectedEvent(file);
    }

    /**
     * Validate file
     */
    validateFile(file) {
        // Check if file exists
        if (!file) {
            return { valid: false, error: 'No file selected' };
        }

        // Check file size
        if (file.size > this.options.maxFileSize) {
            return {
                valid: false,
                error: `File size (${this.formatFileSize(file.size)}) exceeds maximum allowed size of ${this.formatFileSize(this.options.maxFileSize)}`
            };
        }

        // Check if file is empty
        if (file.size === 0) {
            return { valid: false, error: 'File is empty' };
        }

        // Check file extension
        const fileName = file.name.toLowerCase();
        const hasValidExtension = this.options.allowedTypes.some(type => 
            fileName.endsWith(type.toLowerCase())
        );

        if (!hasValidExtension) {
            return {
                valid: false,
                error: `Invalid file type. Allowed types: ${this.options.allowedTypes.join(', ')}`
            };
        }

        return { valid: true };
    }

    /**
     * Update file input with selected file
     */
    updateFileInput(file) {
        const dt = new DataTransfer();
        dt.items.add(file);
        this.fileInput.files = dt.files;
    }

    /**
     * Update upload area UI
     */
    updateUploadAreaUI(file) {
        const extension = this.getFileExtension(file.name);
        const iconClass = this.getFileIcon(extension);
        
        this.uploadArea.innerHTML = `
            <div class="file-selected">
                <i class="fas ${iconClass} fa-3x text-success mb-3"></i>
                <h5 class="text-success">File Selected</h5>
                <p class="file-name">${file.name}</p>
                <p class="file-size text-muted">${this.formatFileSize(file.size)}</p>
                <button type="button" class="btn btn-sm btn-outline-secondary mt-2" onclick="fileUploader.clearFile()">
                    <i class="fas fa-times me-1"></i>Change File
                </button>
            </div>
        `;
    }

    /**
     * Clear selected file
     */
    clearFile() {
        this.currentFile = null;
        this.fileInput.value = '';
        this.resetUploadAreaUI();
        this.dispatchFileClearedEvent();
    }

    /**
     * Reset upload area to initial state
     */
    resetUploadAreaUI() {
        this.uploadArea.innerHTML = `
            <i class="fas fa-cloud-upload-alt fa-3x text-primary mb-3"></i>
            <h5>Drag & Drop your CSV or QFX file here</h5>
            <p class="text-muted">or click to browse</p>
        `;
    }

    /**
     * Upload file with progress tracking
     */
    async uploadFile(additionalData = {}) {
        if (!this.currentFile) {
            throw new Error('No file selected');
        }

        if (this.isUploading) {
            throw new Error('Upload already in progress');
        }

        this.isUploading = true;
        this.uploadProgress = 0;

        try {
            const formData = new FormData();
            formData.append('file', this.currentFile);
            
            // Add additional form data
            for (const [key, value] of Object.entries(additionalData)) {
                formData.append(key, value);
            }

            // Create XMLHttpRequest for progress tracking
            const xhr = new XMLHttpRequest();

            // Setup progress tracking
            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    this.uploadProgress = (e.loaded / e.total) * 100;
                    this.dispatchProgressEvent(this.uploadProgress);
                }
            });

            // Setup completion handler
            const uploadPromise = new Promise((resolve, reject) => {
                xhr.addEventListener('load', () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            const response = JSON.parse(xhr.responseText);
                            resolve(response);
                        } catch (e) {
                            reject(new Error('Invalid JSON response'));
                        }
                    } else {
                        reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
                    }
                });

                xhr.addEventListener('error', () => {
                    reject(new Error('Upload failed due to network error'));
                });

                xhr.addEventListener('abort', () => {
                    reject(new Error('Upload was aborted'));
                });
            });

            // Start upload
            xhr.open('POST', this.options.uploadUrl);
            xhr.send(formData);

            const result = await uploadPromise;
            this.dispatchUploadCompleteEvent(result);
            
            return result;

        } finally {
            this.isUploading = false;
            this.uploadProgress = 0;
        }
    }

    /**
     * Get file extension
     */
    getFileExtension(filename) {
        return filename.split('.').pop().toLowerCase();
    }

    /**
     * Get appropriate icon for file type
     */
    getFileIcon(extension) {
        const iconMap = {
            'csv': 'fa-file-csv',
            'qfx': 'fa-file-alt',
            'ofx': 'fa-file-alt'
        };
        return iconMap[extension] || 'fa-file';
    }

    /**
     * Format file size for display
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Show error message
     */
    showError(message) {
        // Remove existing errors
        const existingErrors = document.querySelectorAll('.upload-error');
        existingErrors.forEach(el => el.remove());

        // Create error element
        const errorEl = document.createElement('div');
        errorEl.className = 'upload-error alert alert-danger mt-3';
        errorEl.innerHTML = `<i class="fas fa-exclamation-triangle me-2"></i>${message}`;

        // Insert after upload area
        this.uploadArea.parentNode.insertBefore(errorEl, this.uploadArea.nextSibling);

        // Auto-remove after 8 seconds
        setTimeout(() => {
            if (errorEl.parentNode) {
                errorEl.parentNode.removeChild(errorEl);
            }
        }, 8000);
    }

    /**
     * Dispatch file selected event
     */
    dispatchFileSelectedEvent(file) {
        const event = new CustomEvent('fileSelected', {
            detail: { file, handler: this }
        });
        document.dispatchEvent(event);
    }

    /**
     * Dispatch file cleared event
     */
    dispatchFileClearedEvent() {
        const event = new CustomEvent('fileCleared', {
            detail: { handler: this }
        });
        document.dispatchEvent(event);
    }

    /**
     * Dispatch upload progress event
     */
    dispatchProgressEvent(progress) {
        const event = new CustomEvent('uploadProgress', {
            detail: { progress, handler: this }
        });
        document.dispatchEvent(event);
    }

    /**
     * Dispatch upload complete event
     */
    dispatchUploadCompleteEvent(result) {
        const event = new CustomEvent('uploadComplete', {
            detail: { result, handler: this }
        });
        document.dispatchEvent(event);
    }

    /**
     * Get current file
     */
    getCurrentFile() {
        return this.currentFile;
    }

    /**
     * Check if file is selected
     */
    hasFile() {
        return this.currentFile !== null;
    }

    /**
     * Check if upload is in progress
     */
    isUploadInProgress() {
        return this.isUploading;
    }

    /**
     * Get current upload progress
     */
    getUploadProgress() {
        return this.uploadProgress;
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.FileUploadHandler = FileUploadHandler;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = FileUploadHandler;
}
