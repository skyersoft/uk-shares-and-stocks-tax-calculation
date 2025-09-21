import React, { useMemo } from 'react';
import { useCalculation } from '../context/CalculationContext';

const ResultsPage: React.FC = () => {
  console.log('[ResultsPage] Rendering component');
  const { state } = useCalculation();
  const holdings = useMemo(()=>{
    const ms = state.raw?.portfolio_analysis?.market_summaries || {};
    let list: any[] = []; 
    Object.values(ms).forEach((m: any) => { 
      if(Array.isArray(m.holdings)) list = list.concat(m.holdings); 
    });
    return list;
  },[state.raw]);

  console.log('[ResultsPage] State:', state.status, 'Holdings:', holdings.length);

  if(state.status!=='success') {
    return (
      <div style={{
        padding: '2rem',
        border: '2px solid orange',
        margin: '10px',
        backgroundColor: '#fff9e6',
        textAlign: 'center'
      }}>
        <h2 style={{ color: 'orange' }}>📊 Results Page</h2>
        <p style={{ fontSize: '18px', margin: '1rem 0' }}>
          {state.status === 'idle' && '🔄 No calculation performed yet'}
          {state.status === 'submitting' && '⏳ Calculation in progress...'}
          {state.status === 'error' && `❌ Error: ${state.error}`}
        </p>
        <button 
          onClick={() => window.location.hash = ''}
          style={{ 
            padding: '1rem 2rem',
            backgroundColor: '#007acc',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          🧮 Go to Calculator
        </button>
      </div>
    );
  }

  return (
    <div style={{
      padding: '2rem',
      border: '3px solid green',
      margin: '10px',
      backgroundColor: '#f0fff0',
      minHeight: '80vh'
    }}>
      <div style={{ 
        backgroundColor: '#4CAF50',
        color: 'white',
        padding: '1rem',
        borderRadius: '8px',
        textAlign: 'center',
        marginBottom: '2rem'
      }}>
        <h1 style={{ margin: 0 }}>📊 Tax Calculation Results</h1>
      </div>
      
      <div style={{ 
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '2rem'
      }}>
        <h2 style={{ color: '#4CAF50' }}>📈 Portfolio Summary</h2>
        <p style={{ fontSize: '18px', fontWeight: 'bold' }}>
          Total Holdings: <span style={{ color: '#4CAF50' }}>{holdings.length}</span>
        </p>
      </div>

      {holdings.length > 0 && (
        <div style={{ 
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '2rem'
        }}>
          <h3 style={{ color: '#4CAF50', marginBottom: '1rem' }}>🏢 Holdings Details (First 10)</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ 
              width: '100%',
              borderCollapse: 'collapse',
              backgroundColor: 'white'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#4CAF50', color: 'white' }}>
                  <th style={{ padding: '12px', border: '1px solid #ddd' }}>Symbol</th>
                  <th style={{ padding: '12px', border: '1px solid #ddd' }}>Quantity</th>
                  <th style={{ padding: '12px', border: '1px solid #ddd' }}>Price</th>
                  <th style={{ padding: '12px', border: '1px solid #ddd' }}>Market Value</th>
                </tr>
              </thead>
              <tbody>
                {holdings.slice(0,10).map((h,i)=>(
                  <tr key={i} style={{ 
                    backgroundColor: i % 2 === 0 ? '#f9f9f9' : 'white'
                  }}>
                    <td style={{ 
                      padding: '10px',
                      border: '1px solid #ddd',
                      fontWeight: 'bold',
                      color: '#4CAF50'
                    }}>{h.symbol||'--'}</td>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{h.quantity||0}</td>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>${h.price||0}</td>
                    <td style={{ 
                      padding: '10px',
                      border: '1px solid #ddd',
                      fontWeight: 'bold'
                    }}>${h.market_value||0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <button 
          onClick={() => window.location.hash = ''}
          style={{ 
            padding: '1rem 2rem',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}
        >
          🧮 New Calculation
        </button>
      </div>
    </div>
  );
};

export default ResultsPage;
