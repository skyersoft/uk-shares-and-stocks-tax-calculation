import React from 'react';
import { CalculationProvider } from './context/CalculationContext';
import CalculatorPage from './pages/CalculatorPage';
import ResultsPage from './pages/ResultsPage';

function App() {
  console.log('[SPA] App component rendering...');
  const hash = typeof window !== 'undefined' ? window.location.hash : '';
  const isResults = hash.startsWith('#results');
  console.log('[SPA] Current hash:', hash, 'isResults:', isResults);
  
  return (
    <CalculationProvider>
      <div style={{ padding: '20px', border: '2px solid green', margin: '10px' }}>
        <h1 style={{ color: 'green' }}>🚀 React SPA Loaded Successfully!</h1>
        <p>Current URL hash: <code>{hash || '(none)'}</code></p>
        <p>Showing: {isResults ? 'Results Page' : 'Calculator Page'}</p>
        {isResults ? <ResultsPage /> : <CalculatorPage />}
      </div>
    </CalculationProvider>
  );
}

export default App;
