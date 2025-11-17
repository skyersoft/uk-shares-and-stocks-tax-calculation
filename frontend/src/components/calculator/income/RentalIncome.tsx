import React from 'react';
import { RentalIncomeData } from '../../../types/calculator';

interface RentalIncomeProps {
  data: RentalIncomeData;
  onChange: (data: RentalIncomeData) => void;
}

export const RentalIncome: React.FC<RentalIncomeProps> = ({ data, onChange }) => {
  const handleChange = (field: keyof RentalIncomeData, value: number | boolean) => {
    onChange({ ...data, [field]: value });
  };

  const handleInputChange = (field: keyof RentalIncomeData, inputValue: string) => {
    const numValue = inputValue === '' ? 0 : parseFloat(inputValue);
    if (!isNaN(numValue) && numValue >= 0) {
      handleChange(field, numValue);
    }
  };

  const PROPERTY_ALLOWANCE = 1000;
  const totalExpenses = data.mortgageInterest + data.repairsCosts + data.agentFees + data.otherExpenses;
  const netIncomeWithAllowance = Math.max(0, data.grossRentalIncome - PROPERTY_ALLOWANCE);
  const netIncomeWithExpenses = Math.max(0, data.grossRentalIncome - totalExpenses);
  const netRentalIncome = data.usePropertyAllowance ? netIncomeWithAllowance : netIncomeWithExpenses;
  const savingsFromAllowance = data.usePropertyAllowance && totalExpenses < PROPERTY_ALLOWANCE;

  return (
    <div className="rental-income card border-danger">
      <div className="card-header bg-danger text-white">
        <h5 className="mb-0">
          <i className="fas fa-home me-2"></i>
          Rental Income
        </h5>
      </div>
      <div className="card-body">
        <p className="text-muted mb-4">
          Enter your rental income details. You can choose between claiming actual expenses or the
          £1,000 property allowance, whichever is more beneficial.
        </p>

        <div className="row g-3">
          {/* Gross Rental Income */}
          <div className="col-12">
            <label htmlFor="grossRentalIncome" className="form-label fw-bold">
              Gross Rental Income (Annual)
              <span className="text-danger">*</span>
            </label>
            <div className="input-group">
              <span className="input-group-text">£</span>
              <input
                type="number"
                className="form-control"
                id="grossRentalIncome"
                value={data.grossRentalIncome || ''}
                onChange={(e) => handleInputChange('grossRentalIncome', e.target.value)}
                min="0"
                step="0.01"
                placeholder="15000"
              />
            </div>
            <div className="form-text">
              Total rent received before any expenses
            </div>
          </div>

          {/* Property Allowance Option */}
          <div className="col-12">
            <div className="card bg-light">
              <div className="card-body">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="usePropertyAllowance"
                    checked={data.usePropertyAllowance}
                    onChange={(e) => handleChange('usePropertyAllowance', e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="usePropertyAllowance">
                    <strong>Use Property Allowance (£{PROPERTY_ALLOWANCE.toLocaleString()})</strong>
                    <div className="small text-muted mt-1">
                      Instead of claiming actual expenses, you can claim a flat £1,000 allowance.
                      This may be beneficial if your expenses are less than £1,000.
                    </div>
                  </label>
                </div>
                
                {savingsFromAllowance && (
                  <div className="alert alert-success mt-2 mb-0">
                    <i className="fas fa-check-circle me-2"></i>
                    <small>
                      <strong>Good choice!</strong> The property allowance saves you from tracking
                      detailed expenses and is worth more than your actual expenses.
                    </small>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Expenses Section - only show if not using property allowance */}
          {!data.usePropertyAllowance && (
            <>
              <div className="col-12">
                <h6 className="text-danger border-bottom pb-2">
                  <i className="fas fa-receipt me-2"></i>
                  Allowable Expenses
                </h6>
                <p className="small text-muted">
                  Enter all expenses related to your rental property. Only allowable expenses can be deducted.
                </p>
              </div>

              <div className="col-12 col-md-6">
                <label htmlFor="mortgageInterest" className="form-label fw-bold">
                  Mortgage Interest
                </label>
                <div className="input-group">
                  <span className="input-group-text">£</span>
                  <input
                    type="number"
                    className="form-control"
                    id="mortgageInterest"
                    value={data.mortgageInterest || ''}
                    onChange={(e) => handleInputChange('mortgageInterest', e.target.value)}
                    min="0"
                    step="0.01"
                    placeholder="0"
                    disabled={data.usePropertyAllowance}
                  />
                </div>
                <div className="form-text">
                  Interest portion only (not capital repayment)
                </div>
              </div>

              <div className="col-12 col-md-6">
                <label htmlFor="repairsCosts" className="form-label fw-bold">
                  Repairs & Maintenance
                </label>
                <div className="input-group">
                  <span className="input-group-text">£</span>
                  <input
                    type="number"
                    className="form-control"
                    id="repairsCosts"
                    value={data.repairsCosts || ''}
                    onChange={(e) => handleInputChange('repairsCosts', e.target.value)}
                    min="0"
                    step="0.01"
                    placeholder="0"
                    disabled={data.usePropertyAllowance}
                  />
                </div>
                <div className="form-text">
                  Repairs, maintenance, and decorating costs
                </div>
              </div>

              <div className="col-12 col-md-6">
                <label htmlFor="agentFees" className="form-label fw-bold">
                  Agent & Management Fees
                </label>
                <div className="input-group">
                  <span className="input-group-text">£</span>
                  <input
                    type="number"
                    className="form-control"
                    id="agentFees"
                    value={data.agentFees || ''}
                    onChange={(e) => handleInputChange('agentFees', e.target.value)}
                    min="0"
                    step="0.01"
                    placeholder="0"
                    disabled={data.usePropertyAllowance}
                  />
                </div>
                <div className="form-text">
                  Letting agent and property management fees
                </div>
              </div>

              <div className="col-12 col-md-6">
                <label htmlFor="otherExpenses" className="form-label fw-bold">
                  Other Allowable Expenses
                </label>
                <div className="input-group">
                  <span className="input-group-text">£</span>
                  <input
                    type="number"
                    className="form-control"
                    id="otherExpenses"
                    value={data.otherExpenses || ''}
                    onChange={(e) => handleInputChange('otherExpenses', e.target.value)}
                    min="0"
                    step="0.01"
                    placeholder="0"
                    disabled={data.usePropertyAllowance}
                  />
                </div>
                <div className="form-text">
                  Insurance, utilities, council tax, etc.
                </div>
              </div>
            </>
          )}

          {/* Summary */}
          <div className="col-12">
            <div className="card bg-light border-0">
              <div className="card-body">
                <h6 className="card-title">
                  <i className="fas fa-calculator me-2 text-danger"></i>
                  Rental Income Summary
                </h6>
                <div className="row g-2">
                  <div className="col-6 col-md-3">
                    <div className="small text-muted">Gross Income</div>
                    <div className="fw-bold text-success">
                      {new Intl.NumberFormat('en-GB', {
                        style: 'currency',
                        currency: 'GBP'
                      }).format(data.grossRentalIncome)}
                    </div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="small text-muted">
                      {data.usePropertyAllowance ? 'Property Allowance' : 'Total Expenses'}
                    </div>
                    <div className="fw-bold text-danger">
                      -{new Intl.NumberFormat('en-GB', {
                        style: 'currency',
                        currency: 'GBP'
                      }).format(data.usePropertyAllowance ? PROPERTY_ALLOWANCE : totalExpenses)}
                    </div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="small text-muted">Taxable Income</div>
                    <div className="fw-bold text-primary">
                      {new Intl.NumberFormat('en-GB', {
                        style: 'currency',
                        currency: 'GBP'
                      }).format(netRentalIncome)}
                    </div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="small text-muted">Method</div>
                    <div className="fw-bold text-info">
                      {data.usePropertyAllowance ? 'Allowance' : 'Expenses'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
