/**
 * Main application JavaScript for IBKR Tax Calculator
 * Handles form submission, API calls, and result display
 */

// Configuration
const API_CONFIG = {
    baseUrl: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 
             `http://${window.location.hostname}:${window.location.port || 5001}` : 'https://zncz8kmatj.execute-api.us-east-1.amazonaws.com/prod',
    endpoints: {
        calculate: '/calculate',
        download: '/download-report',
        health: '/health'
    },
    maxFileSize: 50 * 1024 * 1024, // 50MB
    allowedTypes: ['.csv', '.qfx', '.ofx']
};

// Global state
let uploadedFile = null;
let isCalculating = false;

// DOM elements
let uploadArea, fileInput, calculatorForm, calculateBtn;

/**
 * Initialize the application when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('IBKR Tax Calculator - Initializing...');
    
    // Get DOM elements
    uploadArea = document.querySelector('label[for="fileInput"]'); // The label acts as upload area
    fileInput = document.getElementById('fileInput');
    calculatorForm = document.getElementById('calculatorForm');
    calculateBtn = document.getElementById('calculateBtn');
    
    if (!uploadArea || !fileInput || !calculatorForm || !calculateBtn) {
        console.error('Required DOM elements not found');
        showAlert('Application initialization failed. Please refresh the page.', 'danger');
        return;
    }
    
    // Initialize components
    initializeFileUpload();
    initializeFormHandling();
    addDragDropStyling();
    
    console.log('IBKR Tax Calculator - Initialized successfully');
});

/**
 * Initialize file upload functionality
 */
function initializeFileUpload() {
    console.log('Initializing file upload...');
    console.log('uploadArea:', uploadArea);
    console.log('fileInput:', fileInput);
    
    // The label automatically triggers the file input when clicked
    // No need for additional click handlers since <label for="fileInput"> handles it
    
    // Drag and drop handlers for the upload area
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);

    // File input change
    fileInput.addEventListener('change', handleFileSelect);
    
    console.log('File upload initialized successfully');
}/**
 * Handle drag over event
 */
function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    uploadArea.classList.add('drag-over');
}

/**
 * Handle drag leave event
 */
function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    uploadArea.classList.remove('drag-over');
}

/**
 * Handle file drop event
 */
function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    uploadArea.classList.remove('drag-over');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFileSelect({ target: { files: files } });
    }
}

/**
 * Handle file input change
 */
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    const validTypes = ['.csv', '.qfx', '.ofx'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!validTypes.includes(fileExtension)) {
        showAlert('Please select a CSV or QFX file.', 'danger');
        return;
    }
    
    // Validate file size
    if (file.size > API_CONFIG.maxFileSize) {
        showAlert('File size must be less than 50MB.', 'danger');
        return;
    }
    
    uploadedFile = file;
    updateUploadArea(file);
}

/**
 * Update upload area UI after file selection
 */
function updateUploadArea(file) {
    uploadArea.innerHTML = `
        <i class="fas fa-file-alt fa-3x text-success mb-3"></i>
        <h5 class="text-success">File Selected: ${file.name}</h5>
        <p class="text-muted">Size: ${formatFileSize(file.size)}</p>
        <small class="text-muted">Click to select a different file</small>
    `;
}

/**
 * Format file size for display
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Initialize form handling
 */
function initializeFormHandling() {
    calculatorForm.addEventListener('submit', handleFormSubmit);
}

/**
 * Handle form submission
 */
async function handleFormSubmit(e) {
    e.preventDefault();
    
    if (isCalculating) return;
    
    if (!uploadedFile) {
        showAlert('Please select a file to upload.', 'warning');
        return;
    }
    
    isCalculating = true;
    updateCalculateButton(true);
    
    try {
        const formData = new FormData();
        formData.append('file', uploadedFile);
        formData.append('tax_year', document.getElementById('taxYear').value);
        formData.append('analysis_type', document.getElementById('analysisType').value);
        
        // Show progress
        showProgressModal();
        
        const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.calculate}`, {
            method: 'POST',
            body: formData
        });
        
        hideProgressModal();
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error occurred' }));
            throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.error) {
            throw new Error(result.error);
        }
        
        // Display results
        displayResults(result);
        
    } catch (error) {
        console.error('Calculation error:', error);
        showAlert(`Calculation failed: ${error.message}`, 'danger');
    } finally {
        isCalculating = false;
        updateCalculateButton(false);
    }
}

/**
 * Update calculate button state
 */
function updateCalculateButton(calculating) {
    if (calculating) {
        calculateBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Calculating...';
        calculateBtn.disabled = true;
    } else {
        calculateBtn.innerHTML = '<i class="fas fa-calculator me-2"></i>Calculate Tax & Portfolio';
        calculateBtn.disabled = false;
    }
}

/**
 * Show progress modal
 */
function showProgressModal() {
    const modal = document.createElement('div');
    modal.id = 'progressModal';
    modal.className = 'modal fade show';
    modal.style.display = 'block';
    modal.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-body text-center p-4">
                    <div class="spinner-border text-primary mb-3" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <h5>Processing your file...</h5>
                    <p class="text-muted">This may take a few moments depending on file size</p>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

/**
 * Hide progress modal
 */
function hideProgressModal() {
    const modal = document.getElementById('progressModal');
    if (modal) {
        modal.remove();
    }
}

/**
 * Display calculation results
 */
function displayResults(result) {
    // Remove any existing results
    const existingResults = document.getElementById('resultsSection');
    if (existingResults) {
        existingResults.remove();
    }
    
    // Create results section
    const resultsHtml = `
        <section id="resultsSection" class="py-5 bg-light">
            <div class="container">
                <div class="row">
                    <div class="col-lg-10 mx-auto">
                        <div class="card shadow">
                            <div class="card-header bg-success text-white">
                                <h3 class="mb-0">Tax Calculation Results</h3>
                            </div>
                            <div class="card-body">
                                <div class="row">
                                    <div class="col-md-6">
                                        <h5>Capital Gains Summary</h5>
                                        <table class="table table-bordered">
                                            <tr><td>Total Gains</td><td class="text-end">£${formatNumber(result.total_gains || 0)}</td></tr>
                                            <tr><td>Total Losses</td><td class="text-end">£${formatNumber(result.total_losses || 0)}</td></tr>
                                            <tr><td>Net Gains</td><td class="text-end">£${formatNumber(result.net_gains || 0)}</td></tr>
                                            <tr><td>Annual Exemption</td><td class="text-end">£${formatNumber(result.annual_exemption || 0)}</td></tr>
                                            <tr class="table-warning"><td><strong>Taxable Gains</strong></td><td class="text-end"><strong>£${formatNumber(result.taxable_gains || 0)}</strong></td></tr>
                                            <tr class="table-danger"><td><strong>Capital Gains Tax</strong></td><td class="text-end"><strong>£${formatNumber(result.cgt_tax || 0)}</strong></td></tr>
                                        </table>
                                    </div>
                                    <div class="col-md-6">
                                        <h5>Dividend Summary</h5>
                                        <table class="table table-bordered">
                                            <tr><td>Total Dividends</td><td class="text-end">£${formatNumber(result.total_dividends || 0)}</td></tr>
                                            <tr><td>Dividend Allowance</td><td class="text-end">£${formatNumber(result.dividend_allowance || 0)}</td></tr>
                                            <tr class="table-warning"><td><strong>Taxable Dividends</strong></td><td class="text-end"><strong>£${formatNumber(result.taxable_dividends || 0)}</strong></td></tr>
                                            <tr class="table-danger"><td><strong>Dividend Tax</strong></td><td class="text-end"><strong>£${formatNumber(result.dividend_tax || 0)}</strong></td></tr>
                                        </table>
                                        
                                        <div class="mt-4">
                                            <h5>Total Tax Liability</h5>
                                            <div class="alert alert-danger">
                                                <h4 class="alert-heading">£${formatNumber((result.cgt_tax || 0) + (result.dividend_tax || 0))}</h4>
                                                <p class="mb-0">Total tax owed for ${result.tax_year || 'tax year'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="row mt-4">
                                    <div class="col-12">
                                        <div class="d-flex gap-2">
                                            <button onclick="downloadReport('pdf')" class="btn btn-primary">
                                                <i class="fas fa-download me-2"></i>Download PDF Report
                                            </button>
                                            <button onclick="downloadReport('csv')" class="btn btn-outline-primary">
                                                <i class="fas fa-table me-2"></i>Download CSV Data
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    `;
    
    // Insert results after calculator section
    const calculatorSection = document.getElementById('calculator');
    calculatorSection.insertAdjacentHTML('afterend', resultsHtml);
    
    // Scroll to results
    document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth' });
}

/**
 * Format number for display
 */
function formatNumber(num) {
    return Number(num).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Download report in specified format
 */
async function downloadReport(format) {
    if (!uploadedFile) return;
    
    try {
        const formData = new FormData();
        formData.append('file', uploadedFile);
        formData.append('tax_year', document.getElementById('taxYear').value);
        formData.append('format', format);
        
        const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.download}`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) throw new Error('Download failed');
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tax-report-${document.getElementById('taxYear').value}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
    } catch (error) {
        showAlert(`Download failed: ${error.message}`, 'danger');
    }
}

/**
 * Show alert message
 */
function showAlert(message, type) {
    // Remove existing alerts
    const existingAlerts = document.querySelectorAll('.alert');
    existingAlerts.forEach(alert => alert.remove());
    
    const alertHtml = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    
    const calculatorCard = document.querySelector('#calculator .card');
    calculatorCard.insertAdjacentHTML('beforebegin', alertHtml);
}

/**
 * Add CSS for drag and drop styling
 */
function addDragDropStyling() {
    const style = document.createElement('style');
    style.textContent = `
        .upload-area {
            border: 2px dashed #ddd;
            border-radius: 8px;
            padding: 2rem;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s ease;
            background-color: #f8f9fa;
        }
        
        .upload-area:hover {
            border-color: #007bff;
            background-color: #e3f2fd;
        }
        
        .upload-area.drag-over {
            border-color: #007bff;
            background-color: #e3f2fd;
            transform: scale(1.02);
        }
        
        .ad-container {
            min-height: 250px;
            background-color: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 5px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .content-rich-section {
            font-size: 1.1rem;
            line-height: 1.7;
        }
        
        .accordion-button:not(.collapsed) {
            background-color: #e3f2fd;
            color: #0d6efd;
        }
    `;
    document.head.appendChild(style);
}

/**
 * Handle drag over event
 */
function handleDragOver(e) {
    e.preventDefault();
    uploadArea.classList.add('dragover');
}

/**
 * Handle drag leave event
 */
function handleDragLeave(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
}

/**
 * Handle file drop event
 */
function handleDrop(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFileSelection(files[0]);
    }
}

/**
 * Handle file input change
 */
function handleFileSelect(e) {
    if (e.target.files.length > 0) {
        handleFileSelection(e.target.files[0]);
    }
}

/**
 * Process selected file and update UI
 */
function handleFileSelection(file) {
    console.log('File selected:', file.name, 'Size:', file.size, 'Type:', file.type);
    
    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
        showError(validation.error);
        return;
    }
    
    // Store file
    selectedFile = file;
    
    // Update file input
    const dt = new DataTransfer();
    dt.items.add(file);
    fileInput.files = dt.files;
    
    // Update upload area UI
    updateUploadAreaUI(file);
}

/**
 * Validate uploaded file
 */
function validateFile(file) {
    // Check file size
    if (file.size > API_CONFIG.maxFileSize) {
        return {
            valid: false,
            error: `File size (${formatFileSize(file.size)}) exceeds the maximum allowed size of ${formatFileSize(API_CONFIG.maxFileSize)}`
        };
    }
    
    // Check file type
    const fileName = file.name.toLowerCase();
    const isValidType = fileName.endsWith('.csv') || 
                       fileName.endsWith('.qfx') || 
                       fileName.endsWith('.ofx') ||
                       API_CONFIG.allowedTypes.includes(file.type);
    
    if (!isValidType) {
        return {
            valid: false,
            error: 'Invalid file type. Please upload a CSV or QFX file from Interactive Brokers.'
        };
    }
    
    return { valid: true };
}

/**
 * Update upload area UI after file selection
 */
function updateUploadAreaUI(file) {
    const fileExtension = file.name.split('.').pop().toLowerCase();
    const iconClass = fileExtension === 'csv' ? 'fa-file-csv' : 'fa-file-alt';
    
    uploadArea.innerHTML = `
        <i class="fas ${iconClass} fa-3x text-success mb-3"></i>
        <h5 class="text-success">File Selected: ${file.name}</h5>
        <p class="text-muted">Size: ${formatFileSize(file.size)}</p>
        <small class="text-muted">Click to change file</small>
        <input type="file" id="fileInput" name="file" accept=".csv,.qfx,.ofx" class="d-none">
    `;
    
    // Re-attach event listener to new file input
    const newFileInput = document.getElementById('fileInput');
    newFileInput.addEventListener('change', handleFileSelect);
}

/**
 * Initialize form handling
 */
function initializeFormHandling() {
    calculatorForm.addEventListener('submit', handleFormSubmit);
}

/**
 * Handle form submission
 */
async function handleFormSubmit(e) {
    e.preventDefault();
    
    if (isCalculating) {
        console.log('Calculation already in progress');
        return;
    }
    
    console.log('Form submission started');
    
    // Validate form
    if (!selectedFile) {
        showError('Please select a file before submitting.');
        return;
    }
    
    // Get form data
    const formData = new FormData(calculatorForm);
    
    // Start calculation
    isCalculating = true;
    updateCalculateButton(true);
    
    try {
        const result = await submitCalculation(formData);
        handleCalculationSuccess(result);
    } catch (error) {
        console.error('Calculation error:', error);
        handleCalculationError(error);
    } finally {
        isCalculating = false;
        updateCalculateButton(false);
    }
}

/**
 * Submit calculation to API
 */
async function submitCalculation(formData) {
    console.log('Submitting calculation to API...');
    
    // Debug FormData contents
    for (let [key, value] of formData.entries()) {
        if (value instanceof File) {
            console.log(`${key}: ${value.name} (${formatFileSize(value.size)})`);
        } else {
            console.log(`${key}: ${value}`);
        }
    }
    
    // For local testing, simulate API response
    if (API_CONFIG.localTestMode) {
        console.log('Local test mode - simulating API response');
        
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Return mock data
        return {
            tax_analysis: {
                total_tax_liability: 1250.50,
                capital_gains_tax: 1000.00,
                dividend_tax: 250.50,
                currency_gains_tax: 0.00
            },
            portfolio_analysis: {
                total_portfolio_value: 125000.50,
                total_return_pct: 12.5
            },
            metadata: {
                tax_year: formData.get('tax_year'),
                file_name: formData.get('file').name,
                processing_time_ms: 2000,
                timestamp: new Date().toISOString()
            }
        };
    }
    
    const response = await fetch(API_CONFIG.baseUrl + API_CONFIG.endpoints.calculate, {
        method: 'POST',
        body: formData
    });
    
    console.log('API Response Status:', response.status);
    console.log('API Response Headers:', [...response.headers.entries()]);
    
    if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const responseText = await response.text();
    console.log('API Response Text:', responseText);
    
    let result;
    try {
        result = JSON.parse(responseText);
    } catch (e) {
        console.error('Failed to parse JSON response:', e);
        throw new Error(`Invalid JSON response: ${responseText.substring(0, 200)}`);
    }
    
    console.log('Parsed API Result:', result);
    
    // Check if this is an error response (Lambda function errors usually have an errorMessage)
    if (result.errorMessage || result.error) {
        throw new Error(result.errorMessage || result.error.message || 'Calculation failed');
    }
    
    // If response has a success property, use that format
    if (result.hasOwnProperty('success')) {
        if (!result.success) {
            throw new Error(result.error ? result.error.message : 'Calculation failed');
        }
        return result.data;
    }
    
    // Otherwise, assume the result itself is the data (current Lambda format)
    return result;
}

/**
 * Handle successful calculation
 */
function handleCalculationSuccess(data) {
    console.log('Calculation successful:', data);
    
    // Store result data in sessionStorage for the results page
    sessionStorage.setItem('calculationResults', JSON.stringify(data));
    
    // Navigate to results page
    window.location.href = 'results.html';
}

/**
 * Handle calculation error
 */
function handleCalculationError(error) {
    console.error('Calculation failed:', error);
    showError(`Calculation failed: ${error.message}`);
}

/**
 * Display calculation results (now redirects to results page)
 */
function displayResults(data) {
    // Store results and navigate to results page
    sessionStorage.setItem('calculationResults', JSON.stringify(data));
    window.location.href = 'results.html';
}

/**
 * Generate results HTML
 */
function generateResultsHTML(data) {
    console.log('Generating results HTML for data:', data);
    
    // Use the actual API response structure
    const taxReport = data.tax_report || {};
    const portfolioReport = data.portfolio_report || {};
    const taxYear = data.tax_year || '2024-2025';
    
    return `
        <div class="results-summary">
            <h3>Tax Calculation Results for ${taxYear}</h3>
            
            <div class="row">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h5>Tax Summary</h5>
                        </div>
                        <div class="card-body">
                            <p><strong>Total Estimated Tax:</strong> £${(taxReport.summary?.estimated_tax_liability?.total_estimated_tax || 0).toFixed(2)}</p>
                            <p><strong>Capital Gains Tax:</strong> £${(taxReport.summary?.estimated_tax_liability?.capital_gains_tax || 0).toFixed(2)}</p>
                            <p><strong>Dividend Tax:</strong> £${(taxReport.summary?.estimated_tax_liability?.dividend_tax || 0).toFixed(2)}</p>
                            <p><strong>Currency Gains Tax:</strong> £${(taxReport.summary?.estimated_tax_liability?.currency_gains_tax || 0).toFixed(2)}</p>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h5>Income Summary</h5>
                        </div>
                        <div class="card-body">
                            <p><strong>Capital Gains:</strong> £${(taxReport.capital_gains?.total_gain || 0).toFixed(2)}</p>
                            <p><strong>Dividend Income (Net):</strong> £${(taxReport.dividend_income?.total_net || 0).toFixed(2)}</p>
                            <p><strong>Currency Gains:</strong> £${(taxReport.currency_gains?.net_gain_loss || 0).toFixed(2)}</p>
                            <p><strong>Withholding Tax:</strong> £${(taxReport.dividend_income?.withholding_tax || 0).toFixed(2)}</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="row mt-4">
                <div class="col-12">
                    <div class="card">
                        <div class="card-header">
                            <h5>Portfolio Summary</h5>
                        </div>
                        <div class="card-body">
                            <p><strong>Total Portfolio Value:</strong> £${(portfolioReport.grand_total?.total_value || 0).toLocaleString()}</p>
                            <p><strong>Total Portfolio Cost:</strong> £${(portfolioReport.grand_total?.total_cost || 0).toLocaleString()}</p>
                            <p><strong>Total Return:</strong> ${(portfolioReport.grand_total?.total_return_pct || 0).toFixed(2)}%</p>
                            <p><strong>Number of Holdings:</strong> ${portfolioReport.grand_total?.number_of_holdings || 0}</p>
                            <p><strong>Transaction Count:</strong> ${data.transaction_count || 0}</p>
                            <p><strong>Total Costs:</strong> £${(data.commission_summary?.total_costs || 0).toFixed(2)}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="mt-4">
            <button type="button" class="btn btn-primary" onclick="downloadReport()">
                <i class="fas fa-download me-2"></i>Download Detailed Report
            </button>
        </div>
    `;
}

/**
 * Show results in a modal
 */
function showResultsModal(html) {
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.innerHTML = `
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Calculation Results</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    ${html}
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-primary" onclick="downloadResults()">Download Report</button>
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Show modal
    const bootstrapModal = new bootstrap.Modal(modal);
    bootstrapModal.show();
    
    // Clean up modal when hidden
    modal.addEventListener('hidden.bs.modal', () => {
        document.body.removeChild(modal);
    });
}

/**
 * Update calculate button state
 */
function updateCalculateButton(loading) {
    if (loading) {
        calculateBtn.disabled = true;
        calculateBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Processing...';
    } else {
        calculateBtn.disabled = false;
        calculateBtn.innerHTML = '<i class="fas fa-calculator me-2"></i>Calculate Tax & Portfolio';
    }
}

/**
 * Show error message
 */
function showError(message) {
    // Remove existing error messages
    const existingErrors = document.querySelectorAll('.error-message');
    existingErrors.forEach(el => el.remove());
    
    // Create error element
    const errorEl = document.createElement('div');
    errorEl.className = 'error-message mt-3';
    errorEl.innerHTML = `<i class="fas fa-exclamation-triangle me-2"></i>${message}`;
    
    // Insert after upload area
    uploadArea.parentNode.insertBefore(errorEl, uploadArea.nextSibling);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
        if (errorEl.parentNode) {
            errorEl.parentNode.removeChild(errorEl);
        }
    }, 10000);
}

/**
 * Check API health
 */
async function checkAPIHealth() {
    try {
        const response = await fetch(API_CONFIG.baseUrl + API_CONFIG.endpoints.health);
        if (response.ok) {
            const health = await response.json();
            console.log('API health check passed:', health);
        } else {
            console.warn('API health check failed:', response.status);
        }
    } catch (error) {
        console.warn('API health check error:', error.message);
    }
}

/**
 * Format file size for display
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Download results (placeholder function)
 */
function downloadResults() {
    if (!window.calculationResults) {
        showError('No results available to download');
        return;
    }
    
    // Convert results to JSON and download
    const dataStr = JSON.stringify(window.calculationResults, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tax-calculation-results.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
}

// Export functions for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        validateFile,
        formatFileSize,
        generateResultsHTML
    };
}
