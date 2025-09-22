import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Import Bootstrap JavaScript for navbar collapse functionality
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

// Import global styles
import './styles/global.scss';

console.log('[SPA] Starting React application...');

const container = document.getElementById('spa-root');
console.log('[SPA] Container found:', container);

if (container) {
  console.log('[SPA] Creating React root...');
  const root = createRoot(container);
  console.log('[SPA] Rendering App component...');
  root.render(<App />);
  console.log('[SPA] React app rendered successfully');
} else {
  console.error('[SPA] Mount container #spa-root not found!');
  // Try to create the container as fallback
  const fallbackContainer = document.createElement('div');
  fallbackContainer.id = 'spa-root';
  fallbackContainer.innerHTML = '<p style="color: red; padding: 20px;">SPA container not found - created fallback</p>';
  document.body.appendChild(fallbackContainer);
}
