import React from 'react';
import { CalculationProvider } from './context/CalculationContext';
import { ToastProvider } from './components/ui/ToastContext';
import CalculatorPage from './pages/CalculatorPage';
import ResultsPage from './pages/ResultsPage';

const App: React.FC = () => {
  console.log('[SPA] App component rendering...');
  const hash = typeof window !== 'undefined' ? window.location.hash : '';
  const isResults = hash.startsWith('#results');
  console.log('[SPA] Current hash:', hash, 'isResults:', isResults);
  
  return (
    <ToastProvider position="top-end">
      <CalculationProvider>
        <div className="min-vh-100 bg-light">
          {/* Simple navigation */}
          <nav className="navbar navbar-light bg-white shadow-sm mb-4">
            <div className="container-fluid">
              <span className="navbar-brand mb-0 h1">🚀 UK Tax Calculator</span>
              <small className="text-muted">
                {isResults ? '📊 Results' : '📁 Upload & Calculate'}
              </small>
            </div>
          </nav>
          
          {/* Main content */}
          {isResults ? <ResultsPage /> : <CalculatorPage />}
        </div>
      </CalculationProvider>
    </ToastProvider>
  );
}

export default App;
