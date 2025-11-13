import React from 'react';
import { HoldingsTable } from '../ui/Table';
import { Card } from '../ui/Card';
import { Holding, MarketSummary, NormalizedHolding } from '../../types/calculation';
import { HoldingData, Security } from '../../types';

interface ResultsHoldingsTableProps {
  marketSummaries?: Record<string, MarketSummary>;
  holdings?: NormalizedHolding[];
  className?: string;
}

export const ResultsHoldingsTable: React.FC<ResultsHoldingsTableProps> = ({
  marketSummaries,
  holdings: normalizedHoldings,
  className = ''
}) => {
  // Transform calculation holdings to HoldingData format
  const transformedHoldings: HoldingData[] = React.useMemo(() => {
    if (Array.isArray(normalizedHoldings) && normalizedHoldings.length > 0) {
      return normalizedHoldings.map((holding) => ({
        security: {
          symbol: holding.symbol || 'N/A',
          name: holding.name || holding.symbol || 'N/A'
        },
        quantity: holding.quantity,
        average_cost_gbp: holding.averageCostGBP || 0,
        current_value_gbp: holding.currentValueGBP || 0,
        total_cost_gbp: holding.totalCostGBP,
        unrealized_gain_loss: holding.unrealizedGainLoss || 0,
        total_return_pct: holding.returnPct
      }));
    }

    const legacyHoldings: HoldingData[] = [];
    if (marketSummaries) {
      Object.entries(marketSummaries).forEach(([, summary]) => {
        summary.holdings.forEach((holding: Holding) => {
          const symbol = holding.symbol || holding.security?.symbol || 'N/A';
          const name = holding.name || holding.security?.name || symbol;
          
          const security: Security = {
            symbol,
            name
          };

          const marketValue = holding.market_value || holding.current_value_gbp || 0;
          const averageCost = holding.average_cost || holding.average_cost_gbp || 0;

          const holdingData: HoldingData = {
            security,
            quantity: holding.quantity,
            average_cost_gbp: averageCost,
            current_value_gbp: marketValue,
            total_cost_gbp: averageCost * holding.quantity,
            unrealized_gain_loss: holding.unrealized_gain_loss || 0,
            total_return_pct: holding.unrealized_gain_loss_percent || holding.total_return_pct || 0
          };

          legacyHoldings.push(holdingData);
        });
      });
    }

    return legacyHoldings;
  }, [marketSummaries, normalizedHoldings]);

  const totalValue = transformedHoldings.reduce((total, holding) => total + holding.current_value_gbp, 0);
  const totalGainLoss = transformedHoldings.reduce((total, holding) => total + holding.unrealized_gain_loss, 0);

  // Custom columns to match test expectations
  const customColumns: any[] = [
    {
      key: 'symbol',
      header: 'Symbol',
      accessor: (row: HoldingData) => row.security.symbol,
      sortable: true,
      width: '120px'
    },
    {
      key: 'security',
      header: 'Security',
      accessor: (row: HoldingData) => row.security.name || row.security.symbol,
      sortable: true
    },
    {
      key: 'quantity',
      header: 'Quantity',
      accessor: (row: HoldingData) => row.quantity,
      sortable: true,
      align: 'right' as const,
      render: (value: number) => value.toLocaleString('en-GB', { maximumFractionDigits: 0 })
    },
    {
      key: 'average_cost',
      header: 'Avg Cost',
      accessor: (row: HoldingData) => row.average_cost_gbp,
      sortable: true,
      align: 'right' as const,
      render: (value: number) => `£${value.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`
    },
    {
      key: 'current_value',
      header: 'Current Value',
      accessor: (row: HoldingData) => row.current_value_gbp,
      sortable: true,
      align: 'right' as const,
      render: (value: number) => `£${value.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`
    },
    {
      key: 'gain_loss',
      header: 'Gain/Loss',
      accessor: (row: HoldingData) => row.unrealized_gain_loss,
      sortable: true,
      align: 'right' as const,
      render: (value: number) => (
        <span className={value >= 0 ? 'text-success fw-semibold' : 'text-danger fw-semibold'}>
          {value >= 0 ? '+' : ''}£{value.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
        </span>
      )
    }
  ];

  return (
    <Card
      className={`holdings-table-card ${className}`}
      title="Holdings Details"
      header={
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div className="d-flex align-items-center">
            <h5 className="card-title mb-0">Holdings Details</h5>
          </div>
          <div className="d-flex align-items-center flex-wrap gap-3">
            <span className="badge bg-light text-dark">{transformedHoldings.length} holdings</span>
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
        columns={customColumns}
        loading={false}
        pagination={true}
        emptyMessage="No holdings found"
        className="holdings-results-table"
      />
    </Card>
  );
};

export default ResultsHoldingsTable;
