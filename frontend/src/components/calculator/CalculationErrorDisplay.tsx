import React from 'react';
import type { CalculateErrorDetail } from '../../types/calculator';

interface Props {
  detail: CalculateErrorDetail;
  /** Takes the user back to the upload step so they can remove or replace the file. */
  onGoToUpload: () => void;
}

/** Actionable display for /calculate errors that name missing columns or an unrecognised broker. */
export const CalculationErrorDisplay: React.FC<Props> = ({ detail, onGoToUpload }) => {
  const missingId = 'calc-error-missing';
  const requiredId = 'calc-error-required';
  const brokersId = 'calc-error-brokers';

  return (
    <div className="alert alert-danger mb-4" role="alert">
      <h5 className="alert-heading">
        <i className="fas fa-exclamation-circle me-2" aria-hidden="true"></i>
        {detail.kind === 'missing_columns'
          ? 'Your file is missing columns we need'
          : 'We could not tell which broker this file is from'}
      </h5>
      {detail.message && <p className="mb-2">{detail.message}</p>}

      {detail.kind === 'missing_columns' ? (
        <div className="row g-3">
          <div className="col-md-6">
            <h6 id={missingId}>Missing columns</h6>
            <ul aria-labelledby={missingId} className="mb-0">
              {detail.missingColumns.map((c, i) => <li key={`${c}-${i}`}><code>{c}</code></li>)}
            </ul>
          </div>
          <div className="col-md-6">
            <h6 id={requiredId}>Required columns</h6>
            <ul aria-labelledby={requiredId} className="mb-0">
              {detail.requiredColumns.map((c, i) => <li key={`${c}-${i}`}><code>{c}</code></li>)}
            </ul>
          </div>
        </div>
      ) : (
        <div>
          <h6 id={brokersId}>Supported brokers</h6>
          <ul aria-labelledby={brokersId} className="mb-0">
            {detail.supportedBrokers.map((b, i) => <li key={`${b}-${i}`}>{b}</li>)}
          </ul>
        </div>
      )}

      <hr />
      <p className="mb-2 small">What you can do next:</p>
      <div className="d-flex flex-wrap gap-2">
        <button type="button" className="btn btn-sm btn-primary" onClick={onGoToUpload}>
          Remove the file or upload a different export
        </button>
        <a className="btn btn-sm btn-outline-primary" href="/help" target="_blank" rel="noopener noreferrer">
          Check the export instructions
        </a>
        <a className="btn btn-sm btn-outline-secondary" href="/help#feedback" target="_blank" rel="noopener noreferrer">
          Contact us
        </a>
      </div>
    </div>
  );
};

export default CalculationErrorDisplay;
