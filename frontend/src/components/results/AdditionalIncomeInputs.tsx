import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface AdditionalIncomeData {
  otherIncome: number;
  otherDividends: number;
  otherCapitalGains: number;
}

interface AdditionalIncomeInputsProps {
  onCalculate: (data: AdditionalIncomeData) => void;
  className?: string;
}

export const AdditionalIncomeInputs: React.FC<AdditionalIncomeInputsProps> = ({
  onCalculate,
  className = ''
}) => {
  const [otherIncome, setOtherIncome] = useState<string>('0');
  const [otherDividends, setOtherDividends] = useState<string>('0');
  const [otherCapitalGains, setOtherCapitalGains] = useState<string>('0');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCalculate = () => {
    onCalculate({
      otherIncome: parseFloat(otherIncome) || 0,
      otherDividends: parseFloat(otherDividends) || 0,
      otherCapitalGains: parseFloat(otherCapitalGains) || 0
    });
  };

  const formatCurrency = (value: string): string => {
    const num = parseFloat(value) || 0;
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2
    }).format(num);
  };

  const handleInputChange = (
    value: string,
    setter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    // Allow only numbers and decimal point
    const sanitized = value.replace(/[^\d.]/g, '');
    // Prevent multiple decimal points
    const parts = sanitized.split('.');
    if (parts.length > 2) {
      return;
    }
    setter(sanitized);
  };

  const totalAdditional =
    (parseFloat(otherIncome) || 0) +
    (parseFloat(otherDividends) || 0) +
    (parseFloat(otherCapitalGains) || 0);

  return (
    <Card className={`additional-income-card ${className}`}>
      <div className="card-header bg-light">
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center">
            <i className="fas fa-plus-circle me-2 text-primary" aria-hidden="true"></i>
            <h5 className="card-title mb-0">Additional Income Sources</h5>
          </div>
          <Button
            variant="link"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-decoration-none"
          >
            {isExpanded ? (
              <>
                <i className="fas fa-chevron-up me-1"></i>
                Hide
              </>
            ) : (
              <>
                <i className="fas fa-chevron-down me-1"></i>
                Show
              </>
            )}
          </Button>
        </div>
        <p className="text-muted small mb-0 mt-2">
          Include other income sources not captured in your brokerage statements for a comprehensive tax calculation
        </p>
      </div>

      {isExpanded && (
        <div className="card-body">
          <div className="alert alert-info border-0 mb-4">
            <div className="d-flex align-items-start">
              <i className="fas fa-info-circle me-2 mt-1"></i>
              <div className="small">
                <strong>Note:</strong> Enter any additional income from other sources such as other
                trading accounts, employment income, rental income, or other investments. This will
                help calculate your total UK tax liability more accurately.
              </div>
            </div>
          </div>

          <div className="row g-3 mb-4">
            <div className="col-md-4">
              <label htmlFor="otherIncome" className="form-label fw-semibold">
                <i className="fas fa-pound-sign me-1 text-muted"></i>
                Other Employment/Self-Employment Income
              </label>
              <div className="input-group">
                <span className="input-group-text">£</span>
                <input
                  type="text"
                  className="form-control"
                  id="otherIncome"
                  value={otherIncome}
                  onChange={(e) => handleInputChange(e.target.value, setOtherIncome)}
                  placeholder="0.00"
                  aria-label="Other income amount"
                />
              </div>
              <small className="form-text text-muted">
                Income from employment, self-employment, or other taxable sources
              </small>
            </div>

            <div className="col-md-4">
              <label htmlFor="otherDividends" className="form-label fw-semibold">
                <i className="fas fa-hand-holding-usd me-1 text-muted"></i>
                Other Dividend Income
              </label>
              <div className="input-group">
                <span className="input-group-text">£</span>
                <input
                  type="text"
                  className="form-control"
                  id="otherDividends"
                  value={otherDividends}
                  onChange={(e) => handleInputChange(e.target.value, setOtherDividends)}
                  placeholder="0.00"
                  aria-label="Other dividends amount"
                />
              </div>
              <small className="form-text text-muted">
                Dividends from other investments not in this portfolio
              </small>
            </div>

            <div className="col-md-4">
              <label htmlFor="otherCapitalGains" className="form-label fw-semibold">
                <i className="fas fa-chart-line me-1 text-muted"></i>
                Other Capital Gains
              </label>
              <div className="input-group">
                <span className="input-group-text">£</span>
                <input
                  type="text"
                  className="form-control"
                  id="otherCapitalGains"
                  value={otherCapitalGains}
                  onChange={(e) => handleInputChange(e.target.value, setOtherCapitalGains)}
                  placeholder="0.00"
                  aria-label="Other capital gains amount"
                />
              </div>
              <small className="form-text text-muted">
                Capital gains from property, crypto, or other assets
              </small>
            </div>
          </div>

          {totalAdditional > 0 && (
            <div className="alert alert-secondary border-0 mb-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <strong>Total Additional Income:</strong>
                </div>
                <div className="h5 mb-0 text-primary">
                  {formatCurrency(totalAdditional.toString())}
                </div>
              </div>
            </div>
          )}

          <div className="d-flex justify-content-end gap-2">
            <Button
              variant="outline-secondary"
              onClick={() => {
                setOtherIncome('0');
                setOtherDividends('0');
                setOtherCapitalGains('0');
              }}
            >
              <i className="fas fa-undo me-2"></i>
              Reset
            </Button>
            <Button variant="primary" onClick={handleCalculate}>
              <i className="fas fa-calculator me-2"></i>
              Recalculate Tax
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};

export default AdditionalIncomeInputs;
