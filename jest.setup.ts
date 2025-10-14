// Jest setup for React Testing Library and comprehensive testing  
// Import jest-dom matchers for DOM assertions
import '@testing-library/jest-dom';

// Mock import.meta for Vite compatibility in Jest environment
// This prevents "Cannot use 'import.meta' outside a module" errors
global.importMeta = {
  glob: () => ({})
};

// Polyfill TextEncoder/TextDecoder for jsdom environment
if (typeof global.TextEncoder === 'undefined') {
	const { TextEncoder, TextDecoder } = require('util');
	global.TextEncoder = TextEncoder;
	global.TextDecoder = TextDecoder;
}

// Mock ResizeObserver which is not available in jsdom
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock window.scrollTo
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: jest.fn(),
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.sessionStorage = sessionStorageMock;

// Mock FileReader
global.FileReader = jest.fn().mockImplementation(() => ({
  readAsText: jest.fn(),
  readAsDataURL: jest.fn(),
  readAsArrayBuffer: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  result: null,
  error: null,
}));

// Mock fetch if not already mocked by MSW
if (!global.fetch) {
  global.fetch = jest.fn();
}

// Suppress console errors in tests unless explicitly testing error conditions
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' && 
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Global test timeout
jest.setTimeout(10000);

// Minimal DataTransfer polyfill for tests that manipulate input[type=file]
if (typeof global.DataTransfer === 'undefined') {
	class MockDataTransfer {
		constructor() {
			const store = [];
			this.items = {
				add: (file) => { store.push(file); },
				remove: (index) => { store.splice(index,1); },
				get length() { return store.length; }
			};
			// Provide a minimal FileList-like object
			this.files = {
				item: (i) => store[i] || null,
				get length() { return store.length; },
				[Symbol.iterator]: function*(){ for(const f of store) yield f; }
			};
		}
		get types() { return ['Files']; }
		clearData() { this.items = []; this.files = []; }
		setData() { /* noop */ }
		getData() { return null; }
		dropEffect = 'none';
		effectAllowed = 'all';
	}
	global.DataTransfer = MockDataTransfer;
}

// Mock localStorage for tests executed under jsdom without proper origin
if (typeof global.localStorage === 'undefined') {
	const store = new Map();
	global.localStorage = {
		getItem: (k) => (store.has(k) ? store.get(k) : null),
		setItem: (k, v) => { store.set(k, v.toString()); },
		removeItem: (k) => { store.delete(k); },
		clear: () => { store.clear(); },
		key: (i) => Array.from(store.keys())[i] || null,
		get length() { return store.size; }
	};
}

// Some legacy tests create a fresh jsdom and reassign window/localStorage; ensure our mock persists
if (global.window && global.window.localStorage && !('___patched' in global.window.localStorage)) {
	try {
		// Attempt a write; if it throws SecurityError replace with mock
		const testKey = '__ls_test__';
		global.window.localStorage.setItem(testKey, '1');
		global.window.localStorage.removeItem(testKey);
	} catch (e) {
		const store = new Map();
		const mock = {
			getItem: (k) => (store.has(k) ? store.get(k) : null),
			setItem: (k, v) => { store.set(k, v.toString()); },
			removeItem: (k) => { store.delete(k); },
			clear: () => { store.clear(); },
			key: (i) => Array.from(store.keys())[i] || null,
			get length() { return store.size; },
			___patched: true
		};
		global.window.localStorage = mock;
		global.localStorage = mock;
	}
}

// Minimal bootstrap Modal stub for tests that invoke progress modal
if (typeof global.bootstrap === 'undefined') {
	global.bootstrap = {
		Modal: class {
			constructor(){ this.visible=false; }
			show(){ this.visible=true; }
			hide(){ this.visible=false; }
			static getInstance(){ return null; }
		}
	};
}
