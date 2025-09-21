import React, { useState } from 'react';
import { useCalculation } from '../context/CalculationContext';
import { submitCalculation } from '../services/api';

export default function CalculatorPage() {
  console.log('[CalculatorPage] Rendering component');
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

  console.log('[CalculatorPage] State:', state, 'File:', file);

  return (
    <div style={{ 
      padding: '2rem', 
      fontFamily: 'system-ui, Arial',
      border: '2px solid blue',
      margin: '10px',
      backgroundColor: '#f8f9fa'
    }}>
      <h2 style={{ color: 'blue', marginBottom: '1rem' }}>
        🧮 React Calculator (Modern SPA)
      </h2>
      <p style={{ marginBottom: '1rem', fontSize: '14px', color: '#666' }}>
        Status: <strong>{state.status}</strong> | File: <strong>{file?.name || 'None selected'}</strong>
      </p>
      <form onSubmit={handleSubmit} style={{ marginBottom: '1rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            📁 Select File (CSV or QFX):
          </label>
          <input 
            type="file" 
            accept=".csv,.qfx,.ofx" 
            onChange={e => setFile(e.target.files[0] || null)}
            style={{ 
              padding: '0.5rem', 
              border: '2px solid #ddd', 
              borderRadius: '4px',
              width: '100%',
              fontSize: '14px'
            }}
          />
        </div>
        
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            📅 Tax Year:
          </label>
          <select 
            value={taxYear} 
            onChange={e => setTaxYear(e.target.value)}
            style={{ 
              padding: '0.5rem', 
              border: '2px solid #ddd', 
              borderRadius: '4px',
              fontSize: '14px'
            }}
          >
            {['2024-2025','2023-2024','2022-2023','2021-2022'].map(y => <option key={y}>{y}</option>)}
          </select>
        </div>
        
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            📊 Analysis Type:
          </label>
          <select 
            value={analysisType} 
            onChange={e => setAnalysisType(e.target.value)}
            style={{ 
              padding: '0.5rem', 
              border: '2px solid #ddd', 
              borderRadius: '4px',
              fontSize: '14px'
            }}
          >
            <option value="both">Tax & Portfolio Analysis</option>
            <option value="tax">Tax Analysis Only</option>
            <option value="portfolio">Portfolio Analysis Only</option>
          </select>
        </div>
        
        <button 
          type="submit"
          disabled={state.status === 'submitting' || !file}
          style={{ 
            padding: '1rem 2rem',
            fontSize: '16px',
            fontWeight: 'bold',
            backgroundColor: file ? '#007acc' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: file ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s'
          }}
        >
          {state.status === 'submitting' ? '⏳ Calculating…' : '🚀 Calculate Tax & Portfolio'}
        </button>
      </form>
      
      {state.error && (
        <div style={{ 
          backgroundColor: '#ffe6e6', 
          border: '2px solid #ff4444', 
          padding: '1rem', 
          borderRadius: '8px',
          marginTop: '1rem'
        }}>
          <strong>❌ Error:</strong> {state.error}
        </div>
      )}
      
      {state.status === 'success' && (
        <div style={{ 
          backgroundColor: '#e6ffe6', 
          border: '2px solid #44ff44', 
          padding: '1rem', 
          borderRadius: '8px',
          marginTop: '1rem'
        }}>
          <strong>✅ Success!</strong> Your tax calculation is complete. 
          <button 
            onClick={() => window.location.hash = '#results'}
            style={{ 
              marginLeft: '1rem', 
              padding: '0.5rem 1rem', 
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            📊 View Results
          </button>
        </div>
      )}
      
      <div style={{ 
        marginTop: '2rem', 
        padding: '1rem', 
        backgroundColor: '#fff', 
        border: '1px solid #ddd',
        borderRadius: '8px',
        fontSize: '14px',
        color: '#666'
      }}>
        <strong>ℹ️ About This Version:</strong>
        <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
          <li>Modern React SPA implementation</li>
          <li>Enhanced user interface with real-time feedback</li>
          <li>Same powerful UK tax calculation engine</li>
          <li>Compatible with IBKR QFX and CSV files</li>
        </ul>
      </div>
    </div>
  );
}
