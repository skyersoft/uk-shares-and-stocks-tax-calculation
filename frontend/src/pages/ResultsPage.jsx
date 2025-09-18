import React, { useMemo } from 'react';
import { useCalculation } from '../context/CalculationContext';

function formatCurrency(v){
  const n = Number(v)||0; return '£'+ n.toLocaleString('en-GB',{minimumFractionDigits:2,maximumFractionDigits:2});
}

export default function ResultsPage(){
  const { state } = useCalculation();
  const holdings = useMemo(()=>{
    const ms = state.raw?.portfolio_analysis?.market_summaries || {};
    let list=[]; Object.values(ms).forEach(m=>{ if(Array.isArray(m.holdings)) list=list.concat(m.holdings); });
    return list;
  },[state.raw]);

  if(state.status!=='success') return <div style={{padding:'1rem'}}><em>No results yet.</em></div>;

  return (
    <div style={{ padding: '1rem', fontFamily: 'system-ui, Arial' }}>
      <h2>React Results (Experimental)</h2>
      <p>Holdings: {holdings.length}</p>
      <table border="1" cellPadding="4">
        <thead>
          <tr>
            <th>Symbol</th><th>Qty</th><th>Avg Cost</th><th>Current Value</th><th>Unrealized</th><th>Total Return %</th>
          </tr>
        </thead>
        <tbody>
          {holdings.map(h => (
            <tr key={h.id}>
              <td>{h.security?.symbol || 'N/A'}</td>
              <td>{h.quantity}</td>
              <td>{formatCurrency(h.average_cost_gbp)}</td>
              <td>{formatCurrency(h.current_value_gbp)}</td>
              <td>{formatCurrency(h.unrealized_gain_loss)}</td>
              <td>{(h.total_return_pct ?? 0).toFixed(2)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
      {holdings.length===0 && <div>No holdings parsed.</div>}
    </div>
  );
}
