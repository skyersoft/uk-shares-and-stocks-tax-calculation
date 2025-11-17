import React from 'react';
import { OtherDividendsData } from '../../../types/calculator';

interface OtherDividendsProps {
  data: OtherDividendsData;
  onChange: (data: OtherDividendsData) => void;
}

export const OtherDividends: React.FC<OtherDividendsProps> = ({ data, onChange }) => {
  const handleChange = (field: keyof OtherDividendsData, value: number) => {
    onChange({ ...data, [field]: value });
  };

  const handleInputChange = (field: keyof OtherDividendsData, inputValue: string) => {
    const numValue = inputValue === '' ? 0 : parseFloat(inputValue);
    if (!isNaN(numValue) && numValue >= 0) {
      handleChange(field, numValue);
    }
  };

  const totalDividends = data.ukDividends + data.foreignDividends;

  return (
    <div className="other-dividends card border-warning">
      <div className="card-header bg-warning text-dark">
        <h5 className="mb-0">
          <i className="fas fa-money-bill-wave me-2"></i>
          Other Dividend Income
        </h5>
      </div>
      <div className="card-body">
        <p className="text-muted mb-4">
          Enter dividend income from sources not included in your broker files (e.g., direct shareholdings,
          employee share schemes, or other investment accounts).
        </p>

        <div className="row g-3">
          <div className="col-12 col-md-6">
            <label htmlFor="ukDividends" className="form-label fw-bold">
              UK Dividends
            </label>
            <div className="input-group">
              <span className="input-group-text">£</span>
              <input
                type="number"
                className="form-control"
                id="ukDividends"
                value={data.ukDividends || ''}
                onChange={(e) => handleInputChange('ukDividends', e.target.value)}
                min="0"
                step="0.01"
                placeholder="0"
              />
            </div>
            <div className="form-text">
              Dividends from UK companies
            </div>
          </div>

          <div className="col-12 col-md-6">
            <label htmlFor="foreignDividends" className="form-label fw-bold">
              Foreign Dividends
            </label>
            <div className="input-group">
              <span className="input-group-text">£</span>
              <input
                type="number"
                className="form-control"
                id="foreignDividends"
                value={data.foreignDividends || ''}
                onChange={(e) => handleInputChange('foreignDividends', e.target.value)}
                min="0"
                step="0.01"
                placeholder="0"
              />
            </div>
            <div className="form-text">
              Dividends from non-UK companies (in GBP)
            </div>
          </div>

          {totalDividends > 0 && (
            <div className="col-12">
              <div className="card bg-light border-0">
                <div className="card-body">
                  <h6 className="card-title">
                    <i className="fas fa-calculator me-2 text-warning"></i>
                    Dividend Summary
                  </h6>
                  <div className="row g-2">
                    <div className="col-6">
                      <div className="small text-muted">UK Dividends</div>
                      <div className="fw-bold text-success">
                        {new Intl.NumberFormat('en-GB', {
                          style: 'currency',
                          currency: 'GBP'
                        }).format(data.ukDividends)}
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="small text-muted">Foreign Dividends</div>
                      <div className="fw-bold text-info">
                        {new Intl.NumberFormat('en-GB', {
                          style: 'currency',
                          currency: 'GBP'
                        }).format(data.foreignDividends)}
                      </div>
                    </div>
                    <div className="col-12">
                      <div className="small text-muted">Total Other Dividends</div>
                      <div className="fw-bold text-primary fs-5">
                        {new Intl.NumberFormat('en-GB', {
                          style: 'currency',
                          currency: 'GBP'
                        }).format(totalDividends)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="col-12">
            <div className="alert alert-info mb-0" role="alert">
              <h6 className="alert-heading">
                <i className="fas fa-info-circle me-2"></i>
                Dividend Allowance & Tax Rates
              </h6>
              <p className="mb-2 small">
                All dividends (including those from your portfolio) are subject to:
              </p>
              <ul className="mb-0 small">
                <li><strong>Dividend Allowance:</strong> First £500 is tax-free</li>
                <li><strong>Basic rate taxpayers:</strong> 8.75% on dividends above allowance</li>
                <li><strong>Higher rate taxpayers:</strong> 33.75% on dividends above allowance</li>
                <li><strong>Additional rate taxpayers:</strong> 39.35% on dividends above allowance</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
