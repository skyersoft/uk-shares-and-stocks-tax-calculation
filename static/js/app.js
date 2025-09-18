/**
 * Main application JavaScript for IBKR Tax Calculator
 * Handles form submission, API calls, and result display
 */

// Configuration
// Dynamically determine API base URL so we don't have to hard-code the CloudFront distribution.
// Primary pattern: same origin + '/prod' (CloudFront behavior routing to API Gateway)
// Fallbacks: direct execute-api URL (embedded at build time if provided via placeholder) or previously hard-coded value.
const EXECUTE_API_FALLBACK = '__EXECUTE_API_URL__'; // optionally replaced during deployment

function resolveApiBaseUrl() {
    try {
        const origin = window.location.origin;
        // If we are already under a path that includes /prod, keep it
        if (origin.includes('localhost')) {
            // Local dev might proxy or use env var
            return origin.replace(/\/$/, '') + '/prod';
        }
        // Production site root (custom domain via CloudFront)
        if (!origin.endsWith('/prod')) {
            return origin + '/prod';
        }
        return origin;
    } catch (e) {
        console.warn('Could not resolve dynamic origin, using generic /prod path', e);
        return '/prod';
    }
}

let dynamicBase = resolveApiBaseUrl();
// If placeholder was replaced and dynamicBase fails later, we can attempt fallback
const API_CONFIG = {
    baseUrl: dynamicBase,
    endpoints: {
        calculate: '/calculate',
        download: '/download-report',
        health: '/health'
    },
    maxFileSize: 50 * 1024 * 1024, // 50MB
    allowedTypes: ['.csv', '.qfx', '.ofx'],
    fallbackTried: false
};
// Expose globally for legacy unit tests
if (typeof global !== 'undefined' && !global.API_CONFIG) {
    global.API_CONFIG = API_CONFIG;
}

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
    uploadArea = document.querySelector('label[for="fileInput"]');
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
    checkAPIHealth();
    
    console.log('IBKR Tax Calculator - Initialized successfully');
});

/**
 * Initialize file upload functionality
 */
function initializeFileUpload() {
    if (!uploadArea || !fileInput) return;

    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    fileInput.addEventListener('change', handleFileSelect);
}

/**
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
        handleFileSelection(files[0]);
    }
}

/**
 * Handle file input change
 */
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    handleFileSelection(file);
}

/**
 * Process selected file and update UI
 */
function handleFileSelection(file) {
    const validation = validateFile(file);
    if (!validation.valid) {
        callAlert(validation.error, 'danger');
        return;
    }
    
    uploadedFile = file;
    
    // CRITICAL FIX: Ensure the HTML form input also has the file
    // This prevents FormData from being empty or corrupted
    if (fileInput && fileInput.files[0] !== file) {
        // Create a new FileList containing our file
        const dt = new DataTransfer();
        dt.items.add(file);
        fileInput.files = dt.files;
        console.log('[FILE_SYNC] Synchronized uploadedFile with HTML input');
    }
    
    updateUploadAreaUI(file);
}

/**
 * Validate uploaded file
 */
function validateFile(file) {
    if (file.size > API_CONFIG.maxFileSize) {
        return {
            valid: false,
            error: `File size (${formatFileSize(file.size)}) exceeds the maximum allowed size of ${formatFileSize(API_CONFIG.maxFileSize)}`
        };
    }
    
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    if (!API_CONFIG.allowedTypes.includes(fileExtension)) {
        return {
            valid: false,
            error: `Invalid file type. Please upload one of: ${API_CONFIG.allowedTypes.join(', ')}`
        };
    }
    
    return { valid: true };
}

/**
 * Update upload area UI after file selection
 */
function updateUploadAreaUI(file) {
    const iconClass = file.name.endsWith('.csv') ? 'fa-file-csv' : 'fa-file-alt';
    uploadArea.innerHTML = `
        <i class="fas ${iconClass} fa-3x text-success mb-3"></i>
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
    if (!calculatorForm) return;
    calculatorForm.addEventListener('submit', handleFormSubmit);
}

/**
 * Handle form submission
 */
async function handleFormSubmit(e) {
    e.preventDefault();
    if (!calculatorForm) {
        calculatorForm = document.getElementById('calculatorForm');
    }
    if (!calculateBtn) {
        calculateBtn = document.getElementById('calculateBtn');
    }
    
    if (isCalculating) return;
    
    if (!uploadedFile) {
        callAlert('Please select a file to upload.', 'warning');
        return;
    }
    
    isCalculating = true;
    updateCalculateButton(true);
    showProgressModal();
    
    try {
        // CRITICAL FIX: Use only the HTML form data to avoid duplicate file fields
        const formData = new FormData(calculatorForm);
        
        // Verify the file is properly set in the form
        const formFile = formData.get('file');
        console.log('[FORM_DATA] Form file:', formFile ? formFile.name : 'NULL', 'Size:', formFile ? formFile.size : 'N/A');
        console.log('[FORM_DATA] uploadedFile:', uploadedFile ? uploadedFile.name : 'NULL', 'Size:', uploadedFile ? uploadedFile.size : 'N/A');
        
        // DEBUG: Calculate file hash to verify integrity
        const fileBuffer = await uploadedFile.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest('SHA-256', fileBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        
        const apiUrl = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.calculate}`;
        console.log('[API_CALL] Making request to:', apiUrl);
        console.log('[API_CALL] File being uploaded:', uploadedFile.name, 'Size:', uploadedFile.size);
        console.log('[API_CALL] File SHA-256 hash:', hashHex);
        console.log('[API_CALL] Tax year:', calculatorForm.querySelector('[name="tax_year"]')?.value);
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown server error' }));
            throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        // DEBUG: Log what we actually received from the API
        console.log('[API_RESPONSE] Raw result keys:', Object.keys(result || {}));
        const marketSummaries = result?.portfolio_analysis?.market_summaries;
        if (marketSummaries) {
            Object.keys(marketSummaries).forEach(marketKey => {
                const holdings = marketSummaries[marketKey]?.holdings;
                if (holdings) {
                    console.log(`[API_RESPONSE] Market ${marketKey}: ${holdings.length} holdings`);
                    holdings.forEach((h, i) => {
                        console.log(`[API_RESPONSE]   ${i}: ${h.security?.symbol} qty=${h.quantity}`);
                    });
                }
            });
        }
        
        if (result.error) {
            throw new Error(result.error);
        }
        
    handleCalculationSuccess(result);
        
    } catch (error) {
        console.error('Calculation error:', error);
        callAlert(`Calculation failed: ${error.message}`, 'danger');
    } finally {
        isCalculating = false;
        updateCalculateButton(false);
        hideProgressModal();
    }
}

/**
 * Handle successful calculation
 */
function handleCalculationSuccess(data) {
    if (!calculatorForm) {
        calculatorForm = document.getElementById('calculatorForm');
    }
    const resultId = Date.now().toString(36) + Math.random().toString(36).substring(2);
    const taxYear = calculatorForm.querySelector('[name="tax_year"]').value;
    const analysisType = calculatorForm.querySelector('[name="analysis_type"]').value;

    const storageData = {
        data: data,
        timestamp: Date.now(),
        metadata: {
            fileName: uploadedFile.name,
            taxYear: taxYear,
            analysisType: analysisType
        }
    };

    try {
        // Diagnostics: ensure nested structures present
        try {
            const keys = Object.keys(data || {});
            const ms = data?.portfolio_analysis?.market_summaries || {};
            const holdingsArrays = [];
            Object.values(ms).forEach(m => { if (Array.isArray(m.holdings)) holdingsArrays.push(m.holdings); });
            const holdingsLen = holdingsArrays.reduce((acc, arr) => acc + arr.length, 0);
            const sampleHoldings = holdingsArrays.flat().slice(0, 2).map(h => ({ sym: h?.security?.symbol, qty: h.quantity, avg: h.average_cost_gbp }));
            const disposalsLen = data?.tax_analysis?.capital_gains?.disposals?.length ?? 0;
            const dividendsLen = data?.tax_analysis?.dividend_income?.dividends?.length ?? 0;
            console.log('[CalcResult] keys:', keys, 'disposals:', disposalsLen, 'dividends:', dividendsLen, 'holdings:', holdingsLen, 'sampleHoldings:', sampleHoldings);
            if (holdingsLen !== sampleHoldings.length && sampleHoldings.length > 0) {
                console.log('[CalcResult] holding sample indicates detailed array present before storage.');
            }
            if (disposalsLen === 0 && dividendsLen === 0 && holdingsLen === 0) {
                console.warn('[CalcResult] Warning: result appears truncated or empty of arrays.');
            }
        } catch (diagErr) {
            console.warn('Diagnostics logging failed', diagErr);
        }
        // Store original raw calculation JSON under a diagnostic key for comparison
        try {
            localStorage.setItem(`tax_result_original_${resultId}`, JSON.stringify(data));
        } catch (e) {
            console.warn('Could not store original raw result (maybe size limits).');
        }
        localStorage.setItem(`tax_result_${resultId}`, JSON.stringify(storageData));
        try {
            window.location.href = `results.html?id=${resultId}`;
        } catch(navErr) {
            console.warn('Navigation suppressed (test environment):', navErr && navErr.message);
        }
    } catch (e) {
        console.error("Error saving to localStorage:", e);
        callAlert("Could not save results. Your browser's storage might be full or disabled.", "danger");
    }
}

/**
 * Update calculate button state
 */
function updateCalculateButton(calculating) {
    const btn = document.getElementById('calculateBtn');
    if (!btn) return;
    if (calculating) {
        btn.innerHTML = 'Processing...';
        btn.disabled = true;
    } else {
        btn.innerHTML = 'Calculate Tax & Portfolio';
        btn.disabled = false;
    }
}

/**
 * Show progress modal
 */
function showProgressModal() {
    let modal = document.getElementById('progressModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'progressModal';
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-body text-center p-4">
                        <div class="spinner-border text-primary mb-3" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                        <h5>Processing your file...</h5>
                        <p class="text-muted">This may take a few moments depending on file size.</p>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    const bsModal = new bootstrap.Modal(modal, { backdrop: 'static', keyboard: false });
    bsModal.show();
}

/**
 * Hide progress modal
 */
function hideProgressModal() {
    const modalElement = document.getElementById('progressModal');
    if (modalElement) {
        const bsModal = bootstrap.Modal.getInstance(modalElement);
        if (bsModal) {
            bsModal.hide();
        }
    }
}

/**
 * Show alert message
 */
function showAlert(message, type = 'danger') {
    let alertContainer = document.getElementById('alertContainer');
    if (!alertContainer) {
        alertContainer = document.createElement('div');
        alertContainer.id = 'alertContainer';
        document.body.appendChild(alertContainer);
    }
    
    const alertHtml = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
    
    alertContainer.innerHTML = alertHtml;
}

/**
 * Add CSS for drag and drop styling
 */
function addDragDropStyling() {
    const style = document.createElement('style');
    style.textContent = `
        .upload-area.drag-over {
            border-color: #007bff;
            background-color: #e3f2fd;
            transform: scale(1.02);
        }
    `;
    document.head.appendChild(style);
}

/**
 * Check API health
 */
async function checkAPIHealth() {
    try {
    const healthUrl = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.health}`.replace(/([^:])\/\//g, '$1/');
        console.log('Checking API health at:', healthUrl);
        const response = await fetch(healthUrl, { cache: 'no-store' });
        if (response.ok) {
            console.log('API health check passed.');
            return true;
        }
        console.warn('API health non-OK status:', response.status, response.statusText);
        throw new Error(`Health status ${response.status}`);
    } catch (error) {
        console.error('API health check error:', error);
        // Attempt single fallback to direct execute-api if available and not yet tried
        if (!API_CONFIG.fallbackTried && EXECUTE_API_FALLBACK && EXECUTE_API_FALLBACK.startsWith('https://')) {
            API_CONFIG.fallbackTried = true;
            const previous = API_CONFIG.baseUrl;
            API_CONFIG.baseUrl = EXECUTE_API_FALLBACK;
            console.warn(`Retrying health with fallback base URL: ${API_CONFIG.baseUrl} (previous: ${previous})`);
            return checkAPIHealth();
        }
        callAlert('Could not connect to the calculation service. Please try again later.', 'warning');
        return false;
    }
}

// Unified alert invoker to allow jest spying via global.showAlert
function callAlert(message, type) {
    if (typeof global !== 'undefined' && typeof global.showAlert === 'function') {
        return global.showAlert(message, type);
    }
    return showAlert(message, type);
}

// Exports for unit testing (CommonJS style for jest). Guard to avoid redefining in browser.
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        validateFile,
        formatFileSize,
        showAlert,
        updateCalculateButton,
        handleFormSubmit,
        API_CONFIG
    };
}

// Bridge for legacy tests expecting globals
if (typeof global !== 'undefined') {
    if (!global.showAlert) global.showAlert = showAlert;
    if (!global.updateCalculateButton) global.updateCalculateButton = updateCalculateButton;
    if (!global.handleFormSubmit) global.handleFormSubmit = handleFormSubmit;
    if (!global.validateFile) global.validateFile = validateFile;
    if (!global.formatFileSize) global.formatFileSize = formatFileSize;
    // Expose uploadedFile through accessor to share same reference
    if (!Object.getOwnPropertyDescriptor(global, 'uploadedFile')) {
        Object.defineProperty(global, 'uploadedFile', {
            get() { return uploadedFile; },
            set(v) { uploadedFile = v; },
            configurable: true
        });
    }
}