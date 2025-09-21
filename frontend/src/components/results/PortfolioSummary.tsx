import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { PortfolioAnalysis } from '../../types/calculation';

interface PortfolioSummaryProps {
  portfolioAnalysis: PortfolioAnalysis;
  className?: string;
}

export const PortfolioSummary: React.FC<PortfolioSummaryProps> = ({
  portfolioAnalysis,
  className = ''
}) => {
  const formatCurrency = (amount: number, currency = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatPercentage = (percentage: number): string => {
    return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}%`;
  };

  const getGainLossVariant = (amount: number): 'success' | 'danger' => {
    return amount >= 0 ? 'success' : 'danger';
  };

  const totalHoldings = Object.values(portfolioAnalysis.market_summaries)
    .reduce((total, summary) => total + summary.holdings.length, 0);

  return (
    <Card 
      className={`portfolio-summary ${className}`}
      title="Portfolio Summary"
      header={
        <div className="d-flex align-items-center">
          <i className="fas fa-chart-line me-2 text-primary"></i>
          <span>Portfolio Summary</span>
        </div>
      }
    >
      <div className="row g-3">
        {/* Total Portfolio Value */}
        <div className="col-md-4">
          <div className="summary-metric">
            <div className="metric-label text-muted small">Total Portfolio Value</div>
            <div className="metric-value h4 mb-0 text-primary fw-bold">
              {formatCurrency(portfolioAnalysis.total_portfolio_value)}
            </div>
          </div>
        </div>

        {/* Total Holdings */}
        <div className="col-md-4">
          <div className="summary-metric">
            <div className="metric-label text-muted small">Total Holdings</div>
            <div className="metric-value h4 mb-0 fw-bold">
              {totalHoldings}
            </div>
          </div>
        </div>

        {/* Currency Breakdown */}
        <div className="col-md-4">
          <div className="summary-metric">
            <div className="metric-label text-muted small">Currencies</div>
            <div className="metric-value">
              {Object.keys(portfolioAnalysis.market_summaries).map((currency) => (
                <Badge 
                  key={currency} 
                  variant="outline-secondary" 
                  className="me-1 mb-1"
                >
                  {currency}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Unrealized Gain/Loss */}
        <div className="col-md-6">
          <div className="summary-metric">
            <div className="metric-label text-muted small">Unrealized Gain/Loss</div>
            <div className="d-flex align-items-center">
              <div className={`metric-value h5 mb-0 fw-bold text-${getGainLossVariant(portfolioAnalysis.total_unrealized_gain_loss)}`}>
                {formatCurrency(portfolioAnalysis.total_unrealized_gain_loss)}
              </div>
            </div>
          </div>
        </div>

        {/* Unrealized Gain/Loss Percentage */}
        <div className="col-md-6">
          <div className="summary-metric">
            <div className="metric-label text-muted small">Unrealized Gain/Loss %</div>
            <div className="d-flex align-items-center">
              <Badge 
                variant={getGainLossVariant(portfolioAnalysis.total_unrealized_gain_loss_percent)}
                className="fs-6"
              >
                {formatPercentage(portfolioAnalysis.total_unrealized_gain_loss_percent)}
              </Badge>
              <i className={`fas fa-trending-${portfolioAnalysis.total_unrealized_gain_loss_percent >= 0 ? 'up' : 'down'} ms-2`}></i>
            </div>
          </div>
        </div>
      </div>

      {/* Market Summaries by Currency */}
      {Object.keys(portfolioAnalysis.market_summaries).length > 1 && (
        <div className="mt-4">
          <h6 className="text-muted mb-3">
            <i className="fas fa-globe me-2"></i>
            Breakdown by Currency
          </h6>
          <div className="row g-3">
            {Object.entries(portfolioAnalysis.market_summaries).map(([currency, summary]) => (
              <div key={currency} className="col-md-6 col-lg-4">
                <div className="border rounded p-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <Badge variant="primary">{currency}</Badge>
                    <small className="text-muted">{summary.holdings.length} holdings</small>
                  </div>
                  <div className="metric-value h6 mb-1">
                    {formatCurrency(summary.total_market_value, currency)}
                  </div>
                  <div className={`small text-${getGainLossVariant(summary.total_unrealized_gain_loss)}`}>
                    {formatCurrency(summary.total_unrealized_gain_loss, currency)} 
                    ({formatPercentage(summary.total_unrealized_gain_loss_percent)})
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

export default PortfolioSummary;