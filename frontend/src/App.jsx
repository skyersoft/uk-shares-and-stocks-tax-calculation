import React from 'react';
import { CalculationProvider } from './context/CalculationContext';
import CalculatorPage from './pages/CalculatorPage';
import ResultsPage from './pages/ResultsPage';

function App() {
  const hash = typeof window !== 'undefined' ? window.location.hash : '';
  const isResults = hash.startsWith('#results');
  return (
    <CalculationProvider>
      {isResults ? <ResultsPage /> : <CalculatorPage />}
    </CalculationProvider>
  );
}

export default App;
