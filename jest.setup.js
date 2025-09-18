// Jest setup for React Testing Library (v6 uses direct import)
import '@testing-library/jest-dom';

// Polyfill TextEncoder/TextDecoder for jsdom environment (needed by some libraries like whatwg-url)
if (typeof global.TextEncoder === 'undefined') {
	const { TextEncoder, TextDecoder } = require('util');
	global.TextEncoder = TextEncoder;
	global.TextDecoder = TextDecoder;
}

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
