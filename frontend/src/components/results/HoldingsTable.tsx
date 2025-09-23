import React from 'react';
import { HoldingsTable } from '../ui/Table';
import { Card } from '../ui/Card';
import { Holding, MarketSummary } from '../../types/calculation';
import { HoldingData, Security } from '../../types';

interface ResultsHoldingsTableProps {
  marketSummaries: Record<string, MarketSummary>;
  className?: string;
}

export const ResultsHoldingsTable: React.FC<ResultsHoldingsTableProps> = ({
  marketSummaries,
  className = ''
}) => {
  // Transform calculation holdings to HoldingData format
  const transformedHoldings: HoldingData[] = React.useMemo(() => {
    const holdings: HoldingData[] = [];
    
    Object.entries(marketSummaries).forEach(([, summary]) => {
      summary.holdings.forEach((holding: Holding) => {
        const security: Security = {
          symbol: holding.security?.symbol || 'N/A',
          name: holding.security?.name || holding.security?.symbol || 'N/A'
        };

        const holdingData: HoldingData = {
          security,
          quantity: holding.quantity,
          average_cost_gbp: holding.average_cost_gbp || (holding.current_value_gbp / holding.quantity), // Calculate if not provided
          current_value_gbp: holding.current_value_gbp,
          total_cost_gbp: (holding.average_cost_gbp || (holding.current_value_gbp / holding.quantity)) * holding.quantity,
          unrealized_gain_loss: holding.unrealized_gain_loss || 0,
          total_return_pct: holding.total_return_pct || 0
        };

        holdings.push(holdingData);
      });
    });

    return holdings;
  }, [marketSummaries]);

  const totalValue = transformedHoldings.reduce((total, holding) => total + holding.current_value_gbp, 0);
  const totalGainLoss = transformedHoldings.reduce((total, holding) => total + holding.unrealized_gain_loss, 0);

  return (
    <Card 
      className={`holdings-table-card ${className}`}
      title="Holdings Details"
      header={
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center">
            <i className="fas fa-table me-2 text-primary"></i>
            <span>Holdings Details</span>
          </div>
          <div className="d-flex gap-3">
            <small className="text-muted">
              <strong>Total Value:</strong> £{totalValue.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
            </small>
            <small className={`fw-bold ${totalGainLoss >= 0 ? 'text-success' : 'text-danger'}`}>
              <strong>Total P&L:</strong> {totalGainLoss >= 0 ? '+' : ''}£{totalGainLoss.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
            </small>
          </div>
        </div>
      }
    >
      <HoldingsTable
        data={transformedHoldings}
        loading={false}
        pagination={true}
        emptyMessage="No holdings found"
        className="holdings-results-table"
      />
    </Card>
  );
};

export default ResultsHoldingsTable;