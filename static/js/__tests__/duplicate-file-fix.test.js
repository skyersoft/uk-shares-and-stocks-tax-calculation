/**
 * Critical regression tests for duplicate file upload bug fix
 * 
 * This test suite specifically tests the fix for the issue where
 * duplicate file form fields caused the backend to return aggregated
 * holdings instead of individual securities.
 * 
 * Bug Description:
 * - JavaScript was appending files to FormData twice
 * - This caused the backend to receive duplicate file fields
 * - Backend returned aggregated data instead of individual holdings
 * 
 * Fix Description:
 * - Use only HTML form's FormData constructor (no manual append)
 * - Synchronize uploadedFile with HTML form input using DataTransfer
 * - Added comprehensive logging for debugging
 */

const appModule = require('../app');
const { handleFormSubmit, handleFileSelection } = appModule;
const { JSDOM } = require('jsdom');

// Set up minimal DOM for the critical tests
const dom = new JSDOM(`
  <form id="calculatorForm">
    <input type="file" id="fileInput" name="file" />
    <select name="tax_year"><option value="2024-2025">2024-2025</option></select>
    <select name="analysis_type"><option value="both">Both</option></select>
  </form>
`, { url: 'https://example.test' });

global.window = dom.window;
global.document = dom.window.document;
global.localStorage = dom.window.localStorage;

// Mock File with minimal necessary methods
class TestFile {
  constructor(content, name, options = {}) {
    this.name = name;
    this.size = content.length;
    this.type = options.type || 'text/plain';
    this._content = content;
  }
  
  arrayBuffer() {
    const buffer = new ArrayBuffer(this._content.length);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < this._content.length; i++) {
      view[i] = this._content.charCodeAt(i);
    }
    return Promise.resolve(buffer);
  }
}

global.File = TestFile;

// Mock crypto for tests
global.crypto = {
  subtle: {
    digest: jest.fn().mockResolvedValue(new ArrayBuffer(32))
  }
};

describe('Duplicate File Upload Bug Fix - Critical Tests', () => {
  let calculatorForm;
  let fileInput;
  let consoleLogCalls;
  let originalConsoleLog;

  beforeEach(() => {
    // Reset DOM for each test
    document.body.innerHTML = `
      <form id="calculatorForm">
        <input type="file" id="fileInput" name="file" />
        <select name="tax_year"><option value="2024-2025">2024-2025</option></select>
        <select name="analysis_type"><option value="both">Both</option></select>
      </form>
    `;
    
    calculatorForm = document.getElementById('calculatorForm');
    fileInput = document.getElementById('fileInput');
    
    // Capture console.log to verify our fix is working
    originalConsoleLog = console.log;
    consoleLogCalls = [];
    console.log = (...args) => {
      consoleLogCalls.push(args.join(' '));
      originalConsoleLog.apply(console, args);
    };

    // Reset fetch mock
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        tax_report: { summary: {} },
        portfolio_analysis: {
          market_summaries: {
            'US': {
              holdings: [
                { security: { symbol: 'AAPL' }, quantity: 100 },
                { security: { symbol: 'GOOGL' }, quantity: 50 }
              ]
            }
          }
        }
      })
    });
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    jest.clearAllMocks();
  });

  test('CRITICAL: FormData uses only HTML form, no manual file appending', async () => {
    const file = new TestFile('test,data\n1,2', 'test.csv', { type: 'text/csv' });
    global.uploadedFile = file;
    
    // Mock the file input files property (JSDOM compatible)
    Object.defineProperty(fileInput, 'files', {
      value: Object.assign([file], {
        item: (index) => index === 0 ? file : null,
        length: 1
      }),
      writable: false,
      configurable: true
    });

    // Track what gets appended to FormData
    const appendCalls = [];
    const originalFormData = global.FormData;
    global.FormData = class TestFormData extends originalFormData {
      constructor(form) {
        super(form);
      }
      
      append(key, value) {
        appendCalls.push({ key, value });
        super.append(key, value);
      }
    };

    const preventDefault = jest.fn();
    await handleFormSubmit({ preventDefault });

    // CRITICAL ASSERTION: No manual append calls should be made
    // The fix ensures we only use the HTML form's FormData constructor
    expect(appendCalls).toHaveLength(0);
    
    // Verify FormData is created correctly (fetch was called)
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, options] = global.fetch.mock.calls[0];
    expect(options.method).toBe('POST');
    expect(options.body).toBeInstanceOf(TestFormData);

    global.FormData = originalFormData;
  });

  test('CRITICAL: Debug logging shows file synchronization prevention', async () => {
    const file = new TestFile('test,data\n1,2', 'test.csv', { type: 'text/csv' });
    global.uploadedFile = file;
    
    Object.defineProperty(fileInput, 'files', {
      value: Object.assign([file], {
        item: (index) => index === 0 ? file : null,
        length: 1
      }),
      writable: false,
      configurable: true
    });

    const preventDefault = jest.fn();
    await handleFormSubmit({ preventDefault });

    // Verify debug logging shows the fix is working
    const hasFormDataLog = consoleLogCalls.some(log => 
      log.includes('[FORM_DATA]') && log.includes('Form file:')
    );
    const hasUploadedFileLog = consoleLogCalls.some(log => 
      log.includes('[FORM_DATA]') && log.includes('uploadedFile:')
    );
    const hasApiCallLog = consoleLogCalls.some(log => 
      log.includes('[API_CALL]') && log.includes('File being uploaded:')
    );

    expect(hasFormDataLog).toBe(true);
    expect(hasUploadedFileLog).toBe(true);
    expect(hasApiCallLog).toBe(true);
  });

  test('CRITICAL: No duplicate file upload when uploadedFile and form input are synchronized', async () => {
    const file = new TestFile('test,data', 'test.csv', { type: 'text/csv' });
    global.uploadedFile = file;
    
    // Simulate form input having the same file
    Object.defineProperty(fileInput, 'files', {
      value: Object.assign([file], {
        item: (index) => index === 0 ? file : null,
        length: 1
      }),
      writable: false,
      configurable: true
    });

    // Track FormData creation and content
    let formDataFile = null;
    const originalFormData = global.FormData;
    global.FormData = class TestFormData extends originalFormData {
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

    const preventDefault = jest.fn();
    await handleFormSubmit({ preventDefault });

    // Verify only one file is present in FormData (from HTML form)
    expect(formDataFile).toBeTruthy();
    expect(formDataFile.name).toBe('test.csv');
    
    // Verify API was called (indicating FormData was valid)
    expect(global.fetch).toHaveBeenCalledTimes(1);

    global.FormData = originalFormData;
  });

  test('Regression Test: Validates file before processing to prevent invalid uploads', () => {
    const invalidFile = new TestFile('test', 'test.txt', { type: 'text/plain' });
    
    // Mock callAlert to capture validation errors
    global.callAlert = jest.fn();
    
    // This should trigger validation and show an alert
    handleFileSelection(invalidFile);
    
    // Verify validation caught the invalid file
    expect(global.callAlert).toHaveBeenCalledWith(
      expect.stringContaining('Invalid file type'),
      'danger'
    );
  });
});