import React from 'react';
import { TimelineEvent } from '../../types/timeline';

interface UnrealisedTaxPredictionCardProps {
  events: TimelineEvent[];
  className?: string;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(n);

/**
 * Displays the predictive CGT estimate from the CURRENT_DATE event.
 * Shows "if you sold everything today at Yahoo Finance prices, estimated CGT = £X".
 */
export const UnrealisedTaxPredictionCard: React.FC<UnrealisedTaxPredictionCardProps> = ({
  events,
  className = '',
}) => {
  // Prefer CURRENT_DATE, fall back to the last YEAR_END
  const predictiveEvent =
    events.find((e) => e.event_type === 'CURRENT_DATE') ??
    [...events].reverse().find((e) => e.event_type === 'YEAR_END');

  if (!predictiveEvent || predictiveEvent.predictive_sell_all_cgt_gbp === null) {
    return null;
  }

  const cgt = predictiveEvent.predictive_sell_all_cgt_gbp;
  const unrealisedGain = predictiveEvent.unrealised_gain_loss_gbp;
  const unrealisedValue = predictiveEvent.unrealised_value_gbp;
  const taxYear = predictiveEvent.tax_year;

  return (
    <div className={`card border-0 shadow-sm ${className}`}>
      <div className="card-body p-4">
        <div className="d-flex align-items-center mb-3">
          <div
            className="rounded-circle bg-warning bg-opacity-20 d-flex align-items-center justify-content-center me-3"
            style={{ width: 44, height: 44 }}
          >
            <i className="fas fa-calculator text-warning fs-5"></i>
          </div>
          <div>
            <h6 className="mb-0 fw-bold">Predictive CGT Estimate</h6>
            <small className="text-muted">If you sold all holdings today · {taxYear}</small>
          </div>
        </div>

        <div className="row g-3">
          <div className="col-sm-4">
            <div className="text-center p-3 rounded bg-light">
              <div className="text-muted small mb-1">Portfolio Value</div>
              <div className="fw-bold fs-6 text-primary">{fmt(unrealisedValue)}</div>
            </div>
          </div>
          <div className="col-sm-4">
            <div className="text-center p-3 rounded bg-light">
              <div className="text-muted small mb-1">Unrealised Gain</div>
              <div
                className={`fw-bold fs-6 ${
                  unrealisedGain >= 0 ? 'text-success' : 'text-danger'
                }`}
              >
                {fmt(unrealisedGain)}
              </div>
            </div>
          </div>
          <div className="col-sm-4">
            <div className="text-center p-3 rounded bg-warning bg-opacity-10">
              <div className="text-muted small mb-1">Est. CGT Due</div>
              <div className="fw-bold fs-5 text-warning">{fmt(cgt)}</div>
            </div>
          </div>
        </div>

        <p className="text-muted small mb-0 mt-3">
          <i className="fas fa-info-circle me-1"></i>
          Estimated at 18% basic rate on gains above the Annual Exempt Amount, using
          live Yahoo Finance prices. For illustration only — consult a tax adviser.
        </p>
      </div>
    </div>
  );
};
