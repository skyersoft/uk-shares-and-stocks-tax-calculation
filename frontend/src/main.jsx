import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const container = document.getElementById('spa-root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
} else {
  console.warn('[SPA] Mount container #spa-root not found.');
}
