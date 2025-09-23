import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Alert } from '../ui/Alert';
import { TaxCalculation } from '../../types/calculation';

interface TaxCalculationsProps {
  taxCalculations: TaxCalculation;
  className?: string;
}

interface TaxLineItem {
  label: string;
  amount: number;
  description?: string;
  type: 'gain' | 'tax' | 'total';
}

export const TaxCalculations: React.FC<TaxCalculationsProps> = ({
  taxCalculations,
  className = ''
}) => {
  const formatCurrency = (amount: number): string => {
    const safe = typeof amount === 'number' && isFinite(amount) ? amount : 0;
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(safe);
  };

  const taxLineItems: TaxLineItem[] = [
    {
      label: 'Capital Gains Tax',
  amount: Number(taxCalculations.capital_gains_tax) || 0,
      description: 'Tax on capital gains from share disposals',
      type: 'tax'
    },
    {
      label: 'Dividend Tax',
  amount: Number(taxCalculations.dividend_tax) || 0,
      description: 'Tax on dividend income received',
      type: 'tax'
    },
    {
      label: 'Total Tax Liability',
  amount: Number(taxCalculations.total_tax_liability) || 0,
      description: 'Total tax owed to HMRC',
      type: 'total'
    }
  ];

  const hasSignificantTax = taxCalculations.total_tax_liability > 0;
  const section104Pools = taxCalculations.section_104_pools || {};
  const disposalCalculations = taxCalculations.disposal_calculations || [];

  return (
    <div className={`tax-calculations ${className}`}>
      {/* Tax Summary Card */}
      <Card 
        className="tax-summary-card mb-4"
        title="Tax Summary"
        header={
          <div className="d-flex align-items-center">
            <i className="fas fa-calculator me-2 text-warning"></i>
            <span>UK Tax Calculations</span>
          </div>
        }
      >
        {hasSignificantTax && (
          <Alert 
            variant="warning" 
            className="mb-3"
            dismissible={false}
          >
            <div className="d-flex align-items-center">
              <i className="fas fa-exclamation-triangle me-2"></i>
              <div>
                <strong>Tax Liability Identified</strong>
                <div className="small mt-1">
                  You may need to report these gains and pay tax. Please consult with a tax advisor.
                </div>
              </div>
            </div>
          </Alert>
        )}

        <div className="row g-3">
          {taxLineItems.map((item, index) => (
            <div key={index} className="col-md-4">
              <div className="tax-item">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <div className="tax-label small text-muted">{item.label}</div>
                    {item.description && (
                      <div className="tax-description small text-muted">
                        {item.description}
                      </div>
                    )}
                  </div>
                  <Badge 
                    variant={
                      item.type === 'total' 
                        ? (item.amount > 0 ? 'danger' : 'success')
                        : item.amount > 0 
                          ? 'warning' 
                          : 'secondary'
                    }
                    className="ms-2"
                  >
                    {item.amount > 0 ? 'Tax Due' : 'No Tax'}
                  </Badge>
                </div>
                <div className={`tax-amount h5 mb-0 fw-bold ${
                  item.type === 'total' 
                    ? (item.amount > 0 ? 'text-danger' : 'text-success')
                    : item.amount > 0 
                      ? 'text-warning' 
                      : 'text-muted'
                }`}>
                  {formatCurrency(item.amount)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Section 104 Pools Card */}
      {Object.keys(section104Pools).length > 0 && (
        <Card 
          className="section-104-card mb-4"
          title="Section 104 Pools"
          header={
            <div className="d-flex align-items-center">
              <i className="fas fa-layer-group me-2 text-info"></i>
              <span>Section 104 Pools</span>
            </div>
          }
        >
          <div className="mb-3">
            <Alert variant="info" dismissible={false}>
              <div className="small">
                <strong>Section 104 Pools</strong> track the average cost of identical shares.
                These pools are used to calculate capital gains when shares are disposed of.
              </div>
            </Alert>
          </div>

          <div className="row g-3">
            {Object.entries(section104Pools).map(([symbol, pool]: [string, any], index) => (
              <div key={index} className="col-md-6 col-lg-4">
                <div className="border rounded p-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <Badge variant="primary">{symbol}</Badge>
                    <small className="text-muted">Pool</small>
                  </div>
                  <div className="pool-details">
                    <div className="d-flex justify-content-between mb-1">
                      <small className="text-muted">Quantity:</small>
                      <small className="fw-semibold">{pool.quantity || 0}</small>
                    </div>
                    <div className="d-flex justify-content-between mb-1">
                      <small className="text-muted">Total Cost:</small>
                      <small className="fw-semibold">{formatCurrency(pool.total_cost || 0)}</small>
                    </div>
                    <div className="d-flex justify-content-between">
                      <small className="text-muted">Avg Cost:</small>
                      <small className="fw-semibold">
                        {pool.quantity > 0 
                          ? formatCurrency((pool.total_cost || 0) / pool.quantity)
                          : formatCurrency(0)
                        }
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Disposal Calculations Card */}
      {disposalCalculations.length > 0 && (
        <Card 
          className="disposal-calculations-card"
          title="Disposal Calculations"
          header={
            <div className="d-flex align-items-center">
              <i className="fas fa-exchange-alt me-2 text-secondary"></i>
              <span>Share Disposals</span>
            </div>
          }
        >
          <div className="mb-3">
            <Alert variant="info" dismissible={false}>
              <div className="small">
                Detailed calculations for each share disposal, showing gains/losses and tax implications.
              </div>
            </Alert>
          </div>

          <div className="disposal-list">
            {disposalCalculations.slice(0, 5).map((disposal: any, index) => (
              <div key={index} className="disposal-item border-bottom pb-2 mb-2">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <div className="fw-semibold">{disposal.symbol || 'Unknown'}</div>
                    <small className="text-muted">
                      {disposal.disposal_date || 'Date not available'}
                    </small>
                  </div>
                  <div className="text-end">
                    <div className={`fw-semibold ${
                      (disposal.gain_loss || 0) >= 0 ? 'text-success' : 'text-danger'
                    }`}>
                      {(disposal.gain_loss || 0) >= 0 ? '+' : ''}{formatCurrency(disposal.gain_loss || 0)}
                    </div>
                    <small className="text-muted">
                      {disposal.quantity || 0} shares
                    </small>
                  </div>
                </div>
              </div>
            ))}
            
            {disposalCalculations.length > 5 && (
              <div className="text-center">
                <small className="text-muted">
                  ... and {disposalCalculations.length - 5} more disposals
                </small>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default TaxCalculations;