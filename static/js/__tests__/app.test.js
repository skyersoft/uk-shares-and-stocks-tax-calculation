const appModule = require('../app');
const { validateFile, formatFileSize, showAlert, updateCalculateButton, handleFormSubmit, handleFileSelection, updateUploadAreaUI, callAlert } = appModule; // exported functions
const { JSDOM } = require('jsdom');

// Set up a basic DOM environment for testing
const dom = new JSDOM(`
  <div id="calculator">
    <div class="card">
      <form id="calculatorForm">
        <label for="fileInput" class="upload-area"></label>
        <input type="file" id="fileInput" name="file" />
        <select id="taxYear" name="tax_year">
          <option value="2024-2025">2024-2025</option>
        </select>
        <select id="analysisType" name="analysis_type">
          <option value="both">Tax & Portfolio Analysis</option>
        </select>
        <button id="calculateBtn" type="submit">Calculate Tax & Portfolio</button>
      </form>
    </div>
  </div>
`, { url: 'https://example.test' });

global.window = dom.window;
global.document = dom.window.document;
global.localStorage = dom.window.localStorage; // Mock localStorage

// Mock crypto.subtle for SHA-256 hashing in tests
global.crypto = {
  subtle: {
    digest: jest.fn().mockImplementation(() => 
      Promise.resolve(new ArrayBuffer(32)) // Mock SHA-256 hash
    )
  }
};

// Mock DataTransfer for file list creation in tests
global.DataTransfer = class MockDataTransfer {
  constructor() {
    this.items = {
      add: jest.fn()
    };
    this._files = [];
  }
  
  get files() {
    // Return a simple array that acts like FileList for tests
    const fileList = this._files;
    fileList.item = (index) => fileList[index] || null;
    return fileList;
  }
  
  addFile(file) {
    this._files.push(file);
  }
};

// Enhanced File mock with arrayBuffer support
class MockFile {
  constructor(chunks, filename, options = {}) {
    this.name = filename;
    this.size = chunks.join('').length;
    this.type = options.type || 'text/plain';
    this._content = chunks.join('');
  }
  
  arrayBuffer() {
    // Convert string content to ArrayBuffer for test compatibility
    const buffer = new ArrayBuffer(this._content.length);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < this._content.length; i++) {
      view[i] = this._content.charCodeAt(i);
    }
    return Promise.resolve(buffer);
  }
  
  text() {
    return Promise.resolve(this._content);
  }
}

// Replace global File constructor for tests
global.File = MockFile;

// Mock the showAlert and updateCalculateButton functions if they are not directly exported
// and are instead manipulating the DOM directly.
// For this example, I'll assume they are exported and can be spied on.
// If they are not exported, you'd need to mock the DOM manipulation directly.

// Mock the fetch API
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      tax_report: {
        summary: {
          estimated_tax_liability: {
            total_estimated_tax: 1000
          }
        }
      },
      portfolio_report: {
        grand_total: {
          total_value: 50000,
          total_return_pct: 10
        }
      }
    }),
  })
);

describe('app.js', () => {
  let calculatorForm;
  let fileInput;
  let calculateBtn;
  let uploadArea;

  beforeEach(() => {
    // Reset DOM elements before each test
    document.body.innerHTML = `
      <div id="calculator">
        <div class="card">
          <form id="calculatorForm">
            <label for="fileInput" class="upload-area"></label>
            <input type="file" id="fileInput" name="file" />
            <select id="taxYear" name="tax_year">
              <option value="2024-2025">2024-2025</option>
            </select>
            <select id="analysisType" name="analysis_type">
              <option value="both">Tax & Portfolio Analysis</option>
            </select>
            <button id="calculateBtn" type="submit">Calculate Tax & Portfolio</button>
          </form>
        </div>
      </div>
    `;
    calculatorForm = document.getElementById('calculatorForm');
    fileInput = document.getElementById('fileInput');
    calculateBtn = document.getElementById('calculateBtn');
    uploadArea = document.querySelector('.upload-area');

    // Reset mocks
    fetch.mockClear();
    localStorage.clear();
  });

  describe('validateFile', () => {
    it('should return valid for a valid CSV file', () => {
      const file = new File(['col1,col2'], 'test.csv', { type: 'text/csv' });
      const result = validateFile(file);
      expect(result.valid).toBe(true);
    });

    it('should return valid for a valid QFX file', () => {
      const file = new File(['<OFX></OFX>'], 'test.qfx', { type: 'application/vnd.intu.qfx' });
      const result = validateFile(file);
      expect(result.valid).toBe(true);
    });

    it('should return invalid for a file that is too large', () => {
      // Mock API_CONFIG.maxFileSize for this test
      const originalMaxFileSize = global.API_CONFIG.maxFileSize;
      global.API_CONFIG.maxFileSize = 100; // Set a small max size for testing
      const largeFile = new File(['a'.repeat(200)], 'large.csv', { type: 'text/csv' });
      const result = validateFile(largeFile);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds the maximum allowed size');
      global.API_CONFIG.maxFileSize = originalMaxFileSize; // Restore original
    });

    it('should return invalid for an invalid file type', () => {
      const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });
      const result = validateFile(invalidFile);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid file type');
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(100)).toBe('100 Bytes');
    });

    it('should format kilobytes correctly', () => {
      expect(formatFileSize(1024)).toBe('1 KB');
    });

    it('should format megabytes correctly', () => {
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
    });
  });

  describe('showAlert', () => {
    it('should add an alert message to the DOM', () => {
      showAlert('Test message', 'info');
      const alert = document.querySelector('.alert');
      expect(alert).not.toBeNull();
      expect(alert.textContent).toContain('Test message');
      expect(alert.classList.contains('alert-info')).toBe(true);
    });

    it('should remove existing alerts before adding a new one', () => {
      showAlert('First message', 'warning');
      showAlert('Second message', 'success');
      const alerts = document.querySelectorAll('.alert');
      expect(alerts.length).toBe(1);
      expect(alerts[0].textContent).toContain('Second message');
    });
  });

  describe('updateCalculateButton', () => {
    it('should show loading state when calculating is true', () => {
      updateCalculateButton(true);
      expect(calculateBtn.disabled).toBe(true);
  expect(calculateBtn.textContent).toContain('Processing');
    });

    it('should show default state when calculating is false', () => {
      updateCalculateButton(false);
      expect(calculateBtn.disabled).toBe(false);
  expect(calculateBtn.textContent).toMatch(/Calculate Tax.*Portfolio/);
    });
  });

  describe('handleFormSubmit', () => {
    let originalUploadedFile; // To store the mocked uploadedFile

    beforeAll(() => {
      // Mock the global API_CONFIG and uploadedFile for testing handleFormSubmit
      global.API_CONFIG = {
        baseUrl: 'http://test.com',
        endpoints: {
          calculate: '/calculate',
          download: '/download-report',
          health: '/health'
        },
        maxFileSize: 50 * 1024 * 1024,
        allowedTypes: ['.csv', '.qfx', '.ofx']
      };
      // Mock uploadedFile as it's a global variable in app.js
      originalUploadedFile = global.uploadedFile;
      global.uploadedFile = new File(['file content'], 'test.csv', { type: 'text/csv' });
    });

    afterAll(() => {
      // Restore original global variables
      global.API_CONFIG = undefined;
      global.uploadedFile = originalUploadedFile;
    });

    it('should prevent default form submission', async () => {
      const preventDefault = jest.fn();
      await handleFormSubmit({ preventDefault });
      expect(preventDefault).toHaveBeenCalled();
    });

    it('should show alert if no file is selected', async () => {
      global.uploadedFile = null; // Simulate no file selected
      const showAlertSpy = jest.spyOn(global, 'showAlert');
      const preventDefault = jest.fn();
      await handleFormSubmit({ preventDefault });
      expect(showAlertSpy).toHaveBeenCalledWith('Please select a file to upload.', 'warning');
      expect(fetch).not.toHaveBeenCalled();
      showAlertSpy.mockRestore(); // Clean up the spy
    });

    it('should call fetch with correct FormData on successful submission', async () => {
      const file = new File(['file content'], 'test.csv', { type: 'text/csv' });
      global.uploadedFile = file;
      const preventDefault = jest.fn();
      const originalFormData = global.FormData;
      const store = {};
      global.FormData = class extends originalFormData {
        constructor(form){ super(form); }
        append(k,v){ store[k]=v; super.append(k,v); }
      };
      await handleFormSubmit({ preventDefault });
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(store.file).toBe(file);
      expect(store.tax_year).toBeDefined();
      expect(store.analysis_type).toBeDefined();
      global.FormData = originalFormData;
    });

    it('should update button state during calculation', async () => {
      const preventDefault = jest.fn();
      const calls = [];
      const original = global.updateCalculateButton;
      global.updateCalculateButton = (flag) => { calls.push(flag); original(flag); };
      fetch.mockImplementationOnce(() => new Promise(r => setTimeout(() => r({ ok:true, json: async () => ({}) }), 20)));
      await handleFormSubmit({ preventDefault });
      expect(calls[0]).toBe(true);
      expect(calls.includes(false)).toBe(true);
      global.updateCalculateButton = original;
    });

    it('should redirect to results page on successful calculation', async () => {
      const file = new File(['file content'], 'test.csv', { type: 'text/csv' });
      global.uploadedFile = file;
      const preventDefault = jest.fn();
      fetch.mockImplementationOnce(() => Promise.resolve({ ok:true, json: async () => ({ tax_report:{}, portfolio_report:{} }) }));
      const originalHref = window.location.href;
      Object.defineProperty(window.location, 'href', { writable: true, value: 'http://localhost/calc.html' });
      const setItemSpy = jest.spyOn(localStorage, 'setItem');
      await handleFormSubmit({ preventDefault });
      expect(setItemSpy).toHaveBeenCalled();
      expect(window.location.href).toMatch(/results\.html\?id=/);
      window.location.href = originalHref;
      setItemSpy.mockRestore();
    });

    it('should show error alert on failed calculation', async () => {
      const file = new File(['file content'], 'test.csv', { type: 'text/csv' });
      global.uploadedFile = file;
      const preventDefault = jest.fn();
      const errorMessage = 'Network error';
      fetch.mockImplementationOnce(() => Promise.reject(new Error(errorMessage)));
      const showAlertSpy = jest.spyOn(global, 'showAlert');
      await handleFormSubmit({ preventDefault });
      expect(showAlertSpy.mock.calls.some(c => c[0].includes(errorMessage) && c[1] === 'danger')).toBe(true);
      showAlertSpy.mockRestore();
    });

    // CRITICAL: Tests for duplicate file upload bug fix
    describe('Duplicate File Upload Bug Prevention', () => {
      let originalConsoleLog;
      let consoleLogCalls;

      beforeEach(() => {
        // Capture console.log calls to verify debug messages
        originalConsoleLog = console.log;
        consoleLogCalls = [];
        console.log = (...args) => {
          consoleLogCalls.push(args.join(' '));
          originalConsoleLog.apply(console, args);
        };
      });

      afterEach(() => {
        console.log = originalConsoleLog;
      });

      it('should use only FormData from HTML form to prevent duplicate file fields', async () => {
        const file = new File(['test,data\n1,2'], 'test.csv', { type: 'text/csv' });
        global.uploadedFile = file;
        
        // Mock the file input to have our test file
        Object.defineProperty(fileInput, 'files', {
          value: [file],
          configurable: true
        });

        const preventDefault = jest.fn();
        
        // Mock FormData to track what gets added
        const formDataEntries = {};
        const originalFormData = global.FormData;
        global.FormData = class MockFormData extends originalFormData {
          constructor(form) {
            super(form);
            this.form = form;
          }
          
          get(key) {
            // Simulate getting from the actual HTML form
            if (key === 'file') {
              return this.form.querySelector('[name="file"]').files[0];
            }
            return super.get(key);
          }
          
          append(key, value) {
            formDataEntries[key] = value;
            super.append(key, value);
          }
        };

        await handleFormSubmit({ preventDefault });

        // Verify that FormData only contains data from the HTML form
        // and doesn't have duplicate file fields
        expect(fetch).toHaveBeenCalledTimes(1);
        const [url, options] = fetch.mock.calls[0];
        expect(options.method).toBe('POST');
        expect(options.body).toBeInstanceOf(MockFormData);
        
        // Verify no manual append calls were made (which would cause duplicates)
        expect(Object.keys(formDataEntries)).toHaveLength(0);
        
        global.FormData = originalFormData;
      });

      it('should verify FormData contains correct file from HTML form', async () => {
        const file = new File(['test,data\n1,2'], 'test.csv', { type: 'text/csv' });
        global.uploadedFile = file;
        
        // Mock the file input to have our test file
        Object.defineProperty(fileInput, 'files', {
          value: [file],
          configurable: true
        });

        const preventDefault = jest.fn();
        
        // Track FormData.get() calls
        const originalFormData = global.FormData;
        let formDataFile = null;
        global.FormData = class MockFormData extends originalFormData {
          constructor(form) {
            super(form);
          }
          
          get(key) {
            const result = super.get(key);
            if (key === 'file') {
              formDataFile = result;
            }
            return result;
          }
        };

        await handleFormSubmit({ preventDefault });

        // Verify the file in FormData matches our expected file
        expect(formDataFile).toBeTruthy();
        expect(formDataFile.name).toBe('test.csv');
        expect(formDataFile.size).toBe(file.size);
        
        global.FormData = originalFormData;
      });

      it('should log debug information about file synchronization', async () => {
        const file = new File(['test,data\n1,2'], 'test.csv', { type: 'text/csv' });
        global.uploadedFile = file;
        
        // Mock the file input to have our test file
        Object.defineProperty(fileInput, 'files', {
          value: [file],
          configurable: true
        });

        const preventDefault = jest.fn();
        await handleFormSubmit({ preventDefault });

        // Verify debug logging includes file information
        const hasFormDataLog = consoleLogCalls.some(log => 
          log.includes('[FORM_DATA]') && log.includes('test.csv')
        );
        const hasApiCallLog = consoleLogCalls.some(log => 
          log.includes('[API_CALL]') && log.includes('File being uploaded')
        );
        
        expect(hasFormDataLog).toBe(true);
        expect(hasApiCallLog).toBe(true);
      });
    });
  });

  // Tests for handleFileSelection function (synchronization fix)
  describe('handleFileSelection', () => {
    let originalConsoleLog;
    let consoleLogCalls;
    let mockUploadArea;

    beforeEach(() => {
      // Mock console.log to verify synchronization messages
      originalConsoleLog = console.log;
      consoleLogCalls = [];
      console.log = (...args) => {
        consoleLogCalls.push(args.join(' '));
        originalConsoleLog.apply(console, args);
      };

      // Mock callAlert 
      global.callAlert = jest.fn();
      
      // Mock uploadArea DOM element
      mockUploadArea = {
        innerHTML: ''
      };
      
      // Mock the global uploadArea and fileInput variables
      global.uploadArea = mockUploadArea;
      global.fileInput = fileInput;
      
      // Mock updateUploadAreaUI to avoid DOM manipulation issues
      global.updateUploadAreaUI = jest.fn();
    });

    afterEach(() => {
      console.log = originalConsoleLog;
      global.callAlert.mockClear();
      global.updateUploadAreaUI.mockClear();
    });

    it('should synchronize uploadedFile with HTML form input', () => {
      const file = new File(['test,data'], 'test.csv', { type: 'text/csv' });
      
      // Mock the file input files property
      Object.defineProperty(fileInput, 'files', {
        value: [],
        configurable: true
      });

      handleFileSelection(file);

      // Verify uploadedFile is set
      expect(global.uploadedFile).toBe(file);
      
      // Verify updateUploadAreaUI was called
      expect(global.updateUploadAreaUI).toHaveBeenCalledWith(file);
    });

    it('should handle invalid file by showing alert and not setting uploadedFile', () => {
      const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });
      const originalUploadedFile = global.uploadedFile;
      
      handleFileSelection(invalidFile);

      // Verify alert was called with validation error
      expect(global.callAlert).toHaveBeenCalledWith(
        expect.stringContaining('Invalid file type'),
        'danger'
      );
      
      // Verify uploadedFile was not changed
      expect(global.uploadedFile).toBe(originalUploadedFile);
      
      // Verify updateUploadAreaUI was not called
      expect(global.updateUploadAreaUI).not.toHaveBeenCalled();
    });

    it('should handle file size validation correctly', () => {
      // Create a file that exceeds the max size
      const originalMaxFileSize = global.API_CONFIG?.maxFileSize;
      if (global.API_CONFIG) {
        global.API_CONFIG.maxFileSize = 100; // Very small for testing
      }
      
      const largeFile = new File(['x'.repeat(200)], 'large.csv', { type: 'text/csv' });
      
      handleFileSelection(largeFile);

      expect(global.callAlert).toHaveBeenCalledWith(
        expect.stringContaining('exceeds the maximum allowed size'),
        'danger'
      );
      
      // Verify updateUploadAreaUI was not called for invalid file
      expect(global.updateUploadAreaUI).not.toHaveBeenCalled();
      
      // Restore original max file size
      if (global.API_CONFIG && originalMaxFileSize !== undefined) {
        global.API_CONFIG.maxFileSize = originalMaxFileSize;
      }
    });

    it('should validate file before processing', () => {
      const validFile = new File(['test,data'], 'test.csv', { type: 'text/csv' });
      
      // Spy on validateFile to ensure it's called
      const validateFileSpy = jest.spyOn(global, 'validateFile');
      
      handleFileSelection(validFile);
      
      expect(validateFileSpy).toHaveBeenCalledWith(validFile);
      
      validateFileSpy.mockRestore();
    });
  });
});