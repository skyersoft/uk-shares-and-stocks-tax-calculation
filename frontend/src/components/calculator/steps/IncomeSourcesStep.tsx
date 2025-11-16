import React from 'react';
import { IncomeSourceSelection } from '../../../types/calculator';

interface IncomeSourcesStepProps {
  incomeSources: IncomeSourceSelection;
  onChange: (incomeSources: IncomeSourceSelection) => void;
  taxYear: string;
  onTaxYearChange: (taxYear: string) => void;
  analysisType: 'both' | 'tax' | 'portfolio';
  onAnalysisTypeChange: (type: 'both' | 'tax' | 'portfolio') => void;
}

const INCOME_SOURCE_OPTIONS = [
  {
    key: 'investmentPortfolio' as keyof IncomeSourceSelection,
    label: 'Investment Portfolio',
    icon: 'fa-chart-line',
    description: 'Shares, stocks, ETFs, and other investments from brokers',
    color: 'primary'
  },
  {
    key: 'employmentIncome' as keyof IncomeSourceSelection,
    label: 'Employment Income',
    icon: 'fa-briefcase',
    description: 'Salary, bonuses, and benefits in kind from employment',
    color: 'success'
  },
  {
    key: 'selfEmploymentIncome' as keyof IncomeSourceSelection,
    label: 'Self-Employment Income',
    icon: 'fa-user-tie',
    description: 'Income from freelancing, contracting, or running a business',
    color: 'info'
  },
  {
    key: 'otherDividends' as keyof IncomeSourceSelection,
    label: 'Other Dividend Income',
    icon: 'fa-money-bill-wave',
    description: 'Dividends from investments not in your broker files',
    color: 'warning'
  },
  {
    key: 'rentalIncome' as keyof IncomeSourceSelection,
    label: 'Rental Income',
    icon: 'fa-home',
    description: 'Income from renting out property',
    color: 'danger'
  },
  {
    key: 'savingsInterest' as keyof IncomeSourceSelection,
    label: 'Savings Interest',
    icon: 'fa-piggy-bank',
    description: 'Interest from savings accounts and fixed deposits',
    color: 'secondary'
  },
  {
    key: 'otherCapitalGains' as keyof IncomeSourceSelection,
    label: 'Other Capital Gains',
    icon: 'fa-coins',
    description: 'Gains from property sales, cryptocurrency, or other assets',
    color: 'dark'
  },
  {
    key: 'pensionContributions' as keyof IncomeSourceSelection,
    label: 'Pension Contributions',
    icon: 'fa-umbrella',
    description: 'Personal pension contributions for tax relief',
    color: 'primary'
  }
];

const TAX_YEARS = [
  { value: '2024-2025', label: '2024-2025 (Current)' },
  { value: '2023-2024', label: '2023-2024' },
  { value: '2022-2023', label: '2022-2023' },
  { value: '2021-2022', label: '2021-2022' }
];

export const IncomeSourcesStep: React.FC<IncomeSourcesStepProps> = ({
  incomeSources,
  onChange,
  taxYear,
  onTaxYearChange,
  analysisType,
  onAnalysisTypeChange
}) => {
  const handleSourceToggle = (key: keyof IncomeSourceSelection) => {
    onChange({
      ...incomeSources,
      [key]: !incomeSources[key]
    });
  };

  const selectedCount = Object.values(incomeSources).filter(Boolean).length;

  return (
    <div className="income-sources-step">
      {/* Tax Year and Analysis Type Selection */}
      <div className="row mb-4">
        <div className="col-md-6 mb-3">
          <label htmlFor="taxYear" className="form-label fw-bold">
            <i className="fas fa-calendar-alt me-2 text-primary"></i>
            Tax Year
          </label>
          <select
            id="taxYear"
            className="form-select"
            value={taxYear}
            onChange={(e) => onTaxYearChange(e.target.value)}
          >
            {TAX_YEARS.map((year) => (
              <option key={year.value} value={year.value}>
                {year.label}
              </option>
            ))}
          </select>
          <div className="form-text">
            Select the tax year for your calculation
          </div>
        </div>

        <div className="col-md-6 mb-3">
          <label htmlFor="analysisType" className="form-label fw-bold">
            <i className="fas fa-clipboard-list me-2 text-primary"></i>
            Analysis Type
          </label>
          <select
            id="analysisType"
            className="form-select"
            value={analysisType}
            onChange={(e) => onAnalysisTypeChange(e.target.value as 'both' | 'tax' | 'portfolio')}
          >
            <option value="both">Tax & Portfolio Analysis</option>
            <option value="tax">Tax Analysis Only</option>
            <option value="portfolio">Portfolio Analysis Only</option>
          </select>
          <div className="form-text">
            Choose what type of analysis you need
          </div>
        </div>
      </div>

      <div className="mb-4">
        <h5 className="mb-3">
          <i className="fas fa-hand-pointer me-2 text-primary"></i>
          Select Your Income Sources
        </h5>
        <p className="text-muted">
          Choose all that apply. You'll provide details for each selected source in the next step.
          {selectedCount > 0 && (
            <span className="badge bg-primary ms-2">
              {selectedCount} selected
            </span>
          )}
        </p>
      </div>

      {/* Income Source Selection Grid */}
      <div className="row g-3">
        {INCOME_SOURCE_OPTIONS.map((option) => {
          const isSelected = incomeSources[option.key];
          
          return (
            <div key={option.key} className="col-12 col-md-6 col-lg-4">
              <div
                className={`card h-100 cursor-pointer ${
                  isSelected ? `border-${option.color} border-2` : 'border'
                }`}
                onClick={() => handleSourceToggle(option.key)}
                style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
              >
                <div className="card-body">
                  <div className="d-flex align-items-start">
                    <div className="flex-shrink-0">
                      <div
                        className={`rounded-circle d-flex align-items-center justify-content-center ${
                          isSelected ? `bg-${option.color} text-white` : 'bg-light text-muted'
                        }`}
                        style={{ width: '45px', height: '45px' }}
                      >
                        <i className={`fas ${option.icon}`}></i>
                      </div>
                    </div>
                    <div className="flex-grow-1 ms-3">
                      <div className="d-flex justify-content-between align-items-start">
                        <h6 className="mb-1 fw-bold">{option.label}</h6>
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSourceToggle(option.key)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                      <p className="text-muted small mb-0">{option.description}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedCount === 0 && (
        <div className="alert alert-warning mt-4" role="alert">
          <i className="fas fa-exclamation-triangle me-2"></i>
          Please select at least one income source to continue
        </div>
      )}

      {incomeSources.investmentPortfolio && (
        <div className="alert alert-info mt-4" role="alert">
          <i className="fas fa-info-circle me-2"></i>
          <strong>Investment Portfolio:</strong> You'll be able to upload multiple broker files in the next step
        </div>
      )}
    </div>
  );
};
