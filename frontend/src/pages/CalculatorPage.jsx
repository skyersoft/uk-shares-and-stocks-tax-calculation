import React, { useState } from 'react';
import { useCalculation } from '../context/CalculationContext';
import { submitCalculation } from '../services/api';

export default function CalculatorPage() {
  const { state, dispatch } = useCalculation();
  const [file, setFile] = useState(null);
  const [taxYear, setTaxYear] = useState('2024-2025');
  const [analysisType, setAnalysisType] = useState('both');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;
    dispatch({ type: 'SUBMIT_START' });
    try {
      const { raw } = await submitCalculation({ file, taxYear, analysisType });
      // Normalization placeholder: just pass through raw for now
      const normalized = raw;
      dispatch({ type: 'SUBMIT_SUCCESS', payload: { raw, normalized } });
      window.location.hash = '#results';
    } catch (err) {
      dispatch({ type: 'SUBMIT_ERROR', payload: err.message });
    }
  };

  return (
    <div style={{ padding: '1rem', fontFamily: 'system-ui, Arial' }}>
      <h2>React Calculator (Experimental)</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <input type="file" accept=".csv,.qfx,.ofx" onChange={e => setFile(e.target.files[0] || null)} />
        </div>
        <div style={{ marginTop: '0.5rem' }}>
          <label>Tax Year:&nbsp;
            <select value={taxYear} onChange={e => setTaxYear(e.target.value)}>
              {['2024-2025','2023-2024','2022-2023','2021-2022'].map(y => <option key={y}>{y}</option>)}
            </select>
          </label>
        </div>
        <div style={{ marginTop: '0.5rem' }}>
          <label>Analysis Type:&nbsp;
            <select value={analysisType} onChange={e => setAnalysisType(e.target.value)}>
              <option value="both">Tax & Portfolio</option>
              <option value="tax">Tax Only</option>
              <option value="portfolio">Portfolio Only</option>
            </select>
          </label>
        </div>
        <button style={{ marginTop: '0.75rem' }} disabled={state.status === 'submitting' || !file}>
          {state.status === 'submitting' ? 'Calculating…' : 'Calculate'}
        </button>
      </form>
      {state.error && <div style={{ color: 'red' }}>Error: {state.error}</div>}
      {state.status === 'success' && <div style={{ color: 'green' }}>Success! Switch to results tab.</div>}
    </div>
  );
}
