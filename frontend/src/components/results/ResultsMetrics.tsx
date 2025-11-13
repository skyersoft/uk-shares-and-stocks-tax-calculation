import React from 'react';
import { Card } from '../ui/Card';
import { Alert } from '../ui/Alert';
import { ResultsMetrics } from '../../types/calculation';

interface ResultsMetricsProps {
  metrics: ResultsMetrics;
  taxYear: string | null;
  showCgtWarning?: boolean;
  className?: string;
}

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value || 0);

const formatPercentage = (value: number): string =>
  `${(value || 0).toFixed(2)}%`;

export const ResultsMetricsSummary: React.FC<ResultsMetricsProps> = ({
  metrics,
  taxYear,
  showCgtWarning = false,
  className = ''
}) => {
  const cards = [
    {
      icon: 'fas fa-receipt',
      title: 'Total Tax Liability',
      value: formatCurrency(metrics.totalTaxLiability),
      subtitle: 'Capital Gains & Dividend Tax',
      variantClass: 'tax-liability'
    },
    {
      icon: 'fas fa-wallet',
      title: 'Portfolio Value',
      value: formatCurrency(metrics.portfolioValue),
      subtitle: 'Current Market Value',
      variantClass: 'portfolio-value'
    },
    {
      icon: 'fas fa-chart-line',
      title: 'Total Return',
      value: formatPercentage(metrics.totalReturnPercent),
      subtitle: 'Overall Performance',
      variantClass: 'total-return'
    }
  ];

  return (
    <div className={`results-metrics-summary ${className}`}>
      <div className="row g-3 g-md-4 mb-3">
        {cards.map((card, index) => (
          <div className="col-12 col-md-4" key={index}>
            <Card className={`metric-card h-100 shadow-sm border-0 ${card.variantClass}`}>
              <div className="d-flex align-items-center">
                <div className="metric-icon rounded-circle bg-primary bg-opacity-10 text-primary me-3 d-flex align-items-center justify-content-center">
                  <i className={card.icon} aria-hidden="true"></i>
                </div>
                <div>
                  <div className="metric-label text-muted small fw-semibold text-uppercase">
                    {card.title}
                  </div>
                  <div className="metric-value h4 mb-0 fw-bold">{card.value}</div>
                  <div className="metric-subtitle text-muted small">{card.subtitle}</div>
                </div>
              </div>
            </Card>
          </div>
        ))}
      </div>

      {(showCgtWarning || taxYear === '2024-2025') && (
        <Alert variant="warning" className="shadow-sm border-0">
          <div className="d-flex align-items-start">
            <i className="fas fa-exclamation-triangle me-3 text-warning fa-2x" aria-hidden="true"></i>
            <div>
              <h5 className="mb-2">Important: 2024-2025 CGT Rate Changes</h5>
              <p className="mb-3 small">
                The annual CGT allowance has been reduced to £6,000 for the 2024-2025 tax year. Higher-rate taxpayers remain at 20%. Ensure your calculations account for these updated thresholds.
              </p>
              <div className="d-flex flex-wrap gap-3 small">
                <div>
                  <strong>Basic Rate:</strong> 10% (unchanged)
                </div>
                <div>
                  <strong>Higher/Additional Rate:</strong> 20% (unchanged)
                </div>
                <div>
                  <strong>Annual Exemption:</strong> £6,000
                </div>
              </div>
            </div>
          </div>
        </Alert>
      )}
    </div>
  );
};

export default ResultsMetricsSummary;
