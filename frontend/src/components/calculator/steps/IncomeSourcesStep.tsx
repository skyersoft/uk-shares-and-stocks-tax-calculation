import React from 'react';
import { IncomeSourceSelection } from '../../../types/calculator';

interface IncomeSourcesStepProps {
  incomeSources: IncomeSourceSelection;
  onChange: (incomeSources: IncomeSourceSelection) => void;
  taxYear: string;
  onTaxYearChange: (taxYear: string) => void;
  analysisType: 'both' | 'tax' | 'portfolio' | 'unrealised_gains';
  onAnalysisTypeChange: (type: 'both' | 'tax' | 'portfolio' | 'unrealised_gains') => void;
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
  { value: '2025-2026', label: '2025-2026 (Current)' },
  { value: '2024-2025', label: '2024-2025' },
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
      {/* Tax Year and Analysis Type Selection — compact inline row */}
      <div className="row g-2 mb-3">
        <div className="col-sm-6">
          <label htmlFor="taxYear" className="form-label fw-semibold small mb-1">
            <i className="fas fa-calendar-alt me-1 text-primary"></i>Tax Year
          </label>
          <select
            id="taxYear"
            className="form-select form-select-sm"
            value={taxYear}
            onChange={(e) => onTaxYearChange(e.target.value)}
          >
            {TAX_YEARS.map((year) => (
              <option key={year.value} value={year.value}>{year.label}</option>
            ))}
          </select>
        </div>

        <div className="col-sm-6">
          <label htmlFor="analysisType" className="form-label fw-semibold small mb-1">
            <i className="fas fa-clipboard-list me-1 text-primary"></i>Analysis Type
          </label>
          <select
            id="analysisType"
            className="form-select form-select-sm"
            value={analysisType}
            onChange={(e) => onAnalysisTypeChange(e.target.value as 'both' | 'tax' | 'portfolio' | 'unrealised_gains')}
          >
            <option value="both">Tax &amp; Portfolio Analysis</option>
            <option value="tax">Tax Analysis Only</option>
            <option value="portfolio">Portfolio Analysis Only</option>
            <option value="unrealised_gains">Unrealised Gains &amp; Predictive Tax</option>
          </select>
          {analysisType === 'unrealised_gains' && (
            <div className="form-text" style={{ fontSize: '0.72rem' }}>
              Fetches live prices &amp; estimates CGT if you sold today
            </div>
          )}
        </div>
      </div>

      {/* Income Sources header */}
      <div className="d-flex align-items-center justify-content-between mb-2">
        <span className="fw-semibold small">
          <i className="fas fa-hand-pointer me-1 text-primary"></i>
          Income Sources
          <span className="text-muted fw-normal ms-1">— select all that apply</span>
        </span>
        {selectedCount > 0 && (
          <span className="badge bg-primary">{selectedCount} selected</span>
        )}
      </div>

      {/* Compact income source toggle list — 2 columns */}
      <div className="row g-1">
        {INCOME_SOURCE_OPTIONS.map((option) => {
          const isSelected = incomeSources[option.key];
          return (
            <div key={option.key} className="col-12 col-md-6">
              <div
                className={`d-flex align-items-center rounded px-2 py-1 border ${isSelected ? `border-${option.color} bg-${option.color} bg-opacity-10` : 'border-light bg-light'}`}
                onClick={() => handleSourceToggle(option.key)}
                style={{ cursor: 'pointer', transition: 'all 0.15s ease', minHeight: '38px' }}
              >
                <div
                  className={`rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 me-2 ${isSelected ? `bg-${option.color} text-white` : 'bg-white text-muted border'}`}
                  style={{ width: '28px', height: '28px', fontSize: '0.75rem' }}
                >
                  <i className={`fas ${option.icon}`}></i>
                </div>
                <span className="small fw-semibold flex-grow-1" style={{ fontSize: '0.82rem' }}>{option.label}</span>
                <input
                  className="form-check-input ms-2 flex-shrink-0"
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleSourceToggle(option.key)}
                  onClick={(e) => e.stopPropagation()}
                  style={{ marginTop: 0 }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {selectedCount === 0 && (
        <div className="alert alert-warning py-2 mt-2 mb-0 small" role="alert">
          <i className="fas fa-exclamation-triangle me-1"></i>
          Please select at least one income source to continue
        </div>
      )}

      {incomeSources.investmentPortfolio && (
        <div className="alert alert-info py-2 mt-2 mb-0 small" role="alert">
          <i className="fas fa-info-circle me-1"></i>
          <strong>Investment Portfolio selected:</strong> Upload broker files in the next step
        </div>
      )}
    </div>
  );
};
