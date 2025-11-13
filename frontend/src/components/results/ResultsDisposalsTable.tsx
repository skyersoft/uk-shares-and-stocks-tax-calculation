import React from 'react';
import { Card } from '../ui/Card';
import { DisposalsTable } from '../ui/Table';
import { NormalizedDisposal } from '../../types/calculation';

interface ResultsDisposalsTableProps {
  disposals: NormalizedDisposal[];
  className?: string;
}

const formatCurrency = (value: number): string =>
  `£${(value || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const ResultsDisposalsTable: React.FC<ResultsDisposalsTableProps> = ({
  disposals,
  className = ''
}) => {
  const totals = disposals.reduce(
    (acc, disposal) => ({
      proceeds: acc.proceeds + (disposal.proceeds || 0),
      costBasis: acc.costBasis + (disposal.costBasis || 0),
      gainLoss: acc.gainLoss + (disposal.gainLoss || 0)
    }),
    { proceeds: 0, costBasis: 0, gainLoss: 0 }
  );

  const summary = (
    <div className="d-flex flex-wrap gap-3">
      <div className="small text-muted">
        <strong>Total Proceeds:</strong> {formatCurrency(totals.proceeds)}
      </div>
      <div className="small text-muted">
        <strong>Total Cost:</strong> {formatCurrency(totals.costBasis)}
      </div>
      <div className={`small fw-semibold ${totals.gainLoss >= 0 ? 'text-success' : 'text-danger'}`}>
        <strong>Net Gain/Loss:</strong> {totals.gainLoss >= 0 ? '+' : ''}
        {formatCurrency(totals.gainLoss)}
      </div>
    </div>
  );

  return (
    <Card
      className={`results-disposals-table shadow-sm border-0 ${className}`}
      title="Share Disposals"
      header={
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div className="d-flex align-items-center">
            <i className="fas fa-exchange-alt me-2 text-secondary" aria-hidden="true"></i>
            <span>Capital gains and losses from share sales</span>
          </div>
          <span className="badge bg-light text-dark">{disposals.length} disposals</span>
        </div>
      }
      footer={disposals.length > 0 ? summary : undefined}
    >
      <DisposalsTable
        data={disposals.map((disposal) => ({
          disposal_date: disposal.disposalDate,
          security: {
            symbol: disposal.symbol,
            name: disposal.raw?.security?.name || disposal.symbol
          },
          quantity: disposal.quantity,
          proceeds: disposal.proceeds,
          cost_basis: disposal.costBasis,
          gain_or_loss: disposal.gainLoss
        }))}
        pagination
        pageSize={10}
        emptyMessage="No disposals found"
      />
    </Card>
  );
};

export default ResultsDisposalsTable;
