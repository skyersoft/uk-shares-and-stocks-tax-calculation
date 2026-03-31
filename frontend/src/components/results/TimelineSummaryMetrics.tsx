import React from 'react';
import { TimelineSummary } from '../../types/timeline';

interface TimelineSummaryMetricsProps {
  summary: TimelineSummary;
  className?: string;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(n);

export const TimelineSummaryMetrics: React.FC<TimelineSummaryMetricsProps> = ({
  summary,
  className = '',
}) => {
  const metrics = [
    {
      label: 'Unrealised Value',
      value: summary.final_unrealised_value_gbp,
      icon: 'fas fa-chart-area',
      colorClass: 'text-primary',
      bgClass: 'bg-primary bg-opacity-10',
    },
    {
      label: 'Unrealised G/L',
      value: summary.final_unrealised_gain_loss_gbp,
      icon: 'fas fa-trending-up',
      colorClass:
        summary.final_unrealised_gain_loss_gbp >= 0 ? 'text-success' : 'text-danger',
      bgClass:
        summary.final_unrealised_gain_loss_gbp >= 0
          ? 'bg-success bg-opacity-10'
          : 'bg-danger bg-opacity-10',
    },
    {
      label: 'Realised G/L',
      value: summary.final_realised_gain_loss_gbp,
      icon: 'fas fa-pound-sign',
      colorClass:
        summary.final_realised_gain_loss_gbp >= 0 ? 'text-success' : 'text-danger',
      bgClass:
        summary.final_realised_gain_loss_gbp >= 0
          ? 'bg-success bg-opacity-10'
          : 'bg-danger bg-opacity-10',
    },
    {
      label: 'Realised Tax',
      value: summary.final_realised_tax_gbp,
      icon: 'fas fa-file-invoice-dollar',
      colorClass: 'text-warning',
      bgClass: 'bg-warning bg-opacity-10',
    },
    {
      label: 'Income',
      value: summary.final_income_gbp,
      icon: 'fas fa-coins',
      colorClass: 'text-purple',
      bgClass: 'bg-secondary bg-opacity-10',
    },
  ];

  return (
    <div className={`timeline-summary-metrics ${className}`}>
      <div className="row g-3">
        {metrics.map((m) => (
          <div key={m.label} className="col-6 col-md-4 col-lg">
            <div className="card h-100 border-0 shadow-sm">
              <div className="card-body p-3 text-center">
                <div
                  className={`rounded-circle d-inline-flex align-items-center justify-content-center mb-2 ${m.bgClass}`}
                  style={{ width: 40, height: 40 }}
                >
                  <i className={`${m.icon} ${m.colorClass} small`}></i>
                </div>
                <div className={`fs-6 fw-bold ${m.colorClass}`}>{fmt(m.value)}</div>
                <div className="small text-muted mt-1">{m.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
