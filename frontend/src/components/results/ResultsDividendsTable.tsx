import React from 'react';
import { Card } from '../ui/Card';
import { DividendsTable } from '../ui/Table';
import { NormalizedDividend } from '../../types/calculation';

interface ResultsDividendsTableProps {
  dividends: NormalizedDividend[];
  className?: string;
}

const formatCurrency = (value: number): string =>
  `£${(value || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const ResultsDividendsTable: React.FC<ResultsDividendsTableProps> = ({
  dividends,
  className = ''
}) => {
  const totals = dividends.reduce(
    (acc, dividend) => ({
      gross: acc.gross + (dividend.grossAmount || 0),
      withholding: acc.withholding + (dividend.withholdingTax || 0),
      net: acc.net + (dividend.netAmount || 0)
    }),
    { gross: 0, withholding: 0, net: 0 }
  );

  const summary = (
    <div className="d-flex flex-wrap gap-3">
      <div className="small text-muted">
        <strong>Total Gross:</strong> {formatCurrency(totals.gross)}
      </div>
      <div className="small text-muted">
        <strong>Withholding Tax:</strong> {formatCurrency(totals.withholding)}
      </div>
      <div className="small fw-semibold text-success">
        <strong>Total Net:</strong> {formatCurrency(totals.net)}
      </div>
    </div>
  );

  return (
    <Card
      className={`results-dividends-table shadow-sm border-0 ${className}`}
      title="Dividend Income"
      header={
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div className="d-flex align-items-center">
            <i className="fas fa-coins me-2 text-success" aria-hidden="true"></i>
            <span>Dividend payments received during the tax year</span>
          </div>
          <span className="badge bg-light text-dark">{dividends.length} payments</span>
        </div>
      }
      footer={dividends.length > 0 ? summary : undefined}
    >
      <DividendsTable
        data={dividends.map((dividend) => ({
          payment_date: dividend.paymentDate,
          security: {
            symbol: dividend.symbol,
            name: dividend.name || dividend.symbol
          },
          amount_gbp: dividend.grossAmount,
          withholding_tax_gbp: dividend.withholdingTax,
          net_amount_gbp: dividend.netAmount
        }))}
        pagination
        pageSize={10}
        emptyMessage="No dividends found"
      />
    </Card>
  );
};

export default ResultsDividendsTable;
