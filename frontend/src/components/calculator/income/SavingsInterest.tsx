import React from 'react';
import { SavingsInterestData } from '../../../types/calculator';

interface SavingsInterestProps {
  data: SavingsInterestData;
  onChange: (data: SavingsInterestData) => void;
}

export const SavingsInterest: React.FC<SavingsInterestProps> = ({ data, onChange }) => {
  const handleChange = (field: keyof SavingsInterestData, value: number) => {
    onChange({ ...data, [field]: value });
  };

  const handleInputChange = (field: keyof SavingsInterestData, inputValue: string) => {
    const numValue = inputValue === '' ? 0 : parseFloat(inputValue);
    if (!isNaN(numValue) && numValue >= 0) {
      handleChange(field, numValue);
    }
  };

  return (
    <div className="savings-interest card border-secondary">
      <div className="card-header bg-secondary text-white">
        <h5 className="mb-0">
          <i className="fas fa-piggy-bank me-2"></i>
          Savings Interest
        </h5>
      </div>
      <div className="card-body">
        <p className="text-muted mb-4">
          Enter interest earned from savings accounts, ISAs (taxable portion), and fixed deposits.
        </p>

        <div className="row g-3">
          <div className="col-12">
            <label htmlFor="totalInterest" className="form-label fw-bold">
              Total Savings Interest (Annual)
              <span className="text-danger">*</span>
            </label>
            <div className="input-group">
              <span className="input-group-text">£</span>
              <input
                type="number"
                className="form-control"
                id="totalInterest"
                value={data.totalInterest || ''}
                onChange={(e) => handleInputChange('totalInterest', e.target.value)}
                min="0"
                step="0.01"
                placeholder="500"
              />
            </div>
            <div className="form-text">
              Total interest from all savings accounts for the tax year
            </div>
          </div>

          <div className="col-12">
            <div className="alert alert-info mb-0" role="alert">
              <h6 className="alert-heading">
                <i className="fas fa-lightbulb me-2"></i>
                Personal Savings Allowance
              </h6>
              <p className="mb-2 small">
                You may have a tax-free Personal Savings Allowance based on your income:
              </p>
              <ul className="mb-0 small">
                <li><strong>Basic rate taxpayers:</strong> £1,000 tax-free interest</li>
                <li><strong>Higher rate taxpayers:</strong> £500 tax-free interest</li>
                <li><strong>Additional rate taxpayers:</strong> No allowance</li>
              </ul>
              <p className="mb-0 mt-2 small">
                The calculator will automatically apply the correct allowance based on your total income.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
