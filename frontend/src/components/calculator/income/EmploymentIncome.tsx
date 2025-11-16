import React from 'react';
import { EmploymentIncomeData } from '../../../types/calculator';

interface EmploymentIncomeProps {
  data: EmploymentIncomeData;
  onChange: (data: EmploymentIncomeData) => void;
}

export const EmploymentIncome: React.FC<EmploymentIncomeProps> = ({ data, onChange }) => {
  const handleChange = (field: keyof EmploymentIncomeData, value: number) => {
    onChange({ ...data, [field]: value });
  };

  const handleInputChange = (field: keyof EmploymentIncomeData, inputValue: string) => {
    const numValue = inputValue === '' ? 0 : parseFloat(inputValue);
    if (!isNaN(numValue) && numValue >= 0) {
      handleChange(field, numValue);
    }
  };

  const grossIncome = data.grossSalary + data.bonuses;
  const totalDeductions = data.payeTaxPaid + data.niPaid + data.studentLoanDeductions + data.employeePensionContributions;
  const netIncome = grossIncome - totalDeductions;

  return (
    <div className="employment-income card border-success">
      <div className="card-header bg-success text-white">
        <h5 className="mb-0">
          <i className="fas fa-briefcase me-2"></i>
          Employment Income
        </h5>
      </div>
      <div className="card-body">
        <p className="text-muted mb-4">
          Enter your employment income details. All figures should be for the selected tax year.
        </p>

        <div className="row g-3">
          {/* Gross Income Section */}
          <div className="col-12">
            <h6 className="text-success border-bottom pb-2">
              <i className="fas fa-money-bill-wave me-2"></i>
              Gross Income
            </h6>
          </div>

          <div className="col-12 col-md-6">
            <label htmlFor="grossSalary" className="form-label fw-bold">
              Gross Salary (Annual)
              <span className="text-danger">*</span>
            </label>
            <div className="input-group">
              <span className="input-group-text">£</span>
              <input
                type="number"
                className="form-control"
                id="grossSalary"
                value={data.grossSalary || ''}
                onChange={(e) => handleInputChange('grossSalary', e.target.value)}
                min="0"
                step="0.01"
                placeholder="50000"
              />
            </div>
            <div className="form-text">
              Your annual salary before tax and other deductions
            </div>
          </div>

          <div className="col-12 col-md-6">
            <label htmlFor="bonuses" className="form-label fw-bold">
              Bonuses & Commissions
            </label>
            <div className="input-group">
              <span className="input-group-text">£</span>
              <input
                type="number"
                className="form-control"
                id="bonuses"
                value={data.bonuses || ''}
                onChange={(e) => handleInputChange('bonuses', e.target.value)}
                min="0"
                step="0.01"
                placeholder="0"
              />
            </div>
            <div className="form-text">
              Total bonuses, commissions, and other cash payments
            </div>
          </div>

          <div className="col-12 col-md-6">
            <label htmlFor="benefitsInKind" className="form-label fw-bold">
              Benefits in Kind
            </label>
            <div className="input-group">
              <span className="input-group-text">£</span>
              <input
                type="number"
                className="form-control"
                id="benefitsInKind"
                value={data.benefitsInKind || ''}
                onChange={(e) => handleInputChange('benefitsInKind', e.target.value)}
                min="0"
                step="0.01"
                placeholder="0"
              />
            </div>
            <div className="form-text">
              Company car, private medical insurance, etc.
            </div>
          </div>

          {/* Deductions Section */}
          <div className="col-12 mt-4">
            <h6 className="text-success border-bottom pb-2">
              <i className="fas fa-minus-circle me-2"></i>
              Deductions (Optional)
            </h6>
            <p className="small text-muted mb-3">
              If you don't know these amounts, leave them blank and we'll estimate them.
            </p>
          </div>

          <div className="col-12 col-md-6">
            <label htmlFor="payeTaxPaid" className="form-label fw-bold">
              PAYE Tax Already Paid
            </label>
            <div className="input-group">
              <span className="input-group-text">£</span>
              <input
                type="number"
                className="form-control"
                id="payeTaxPaid"
                value={data.payeTaxPaid || ''}
                onChange={(e) => handleInputChange('payeTaxPaid', e.target.value)}
                min="0"
                step="0.01"
                placeholder="0"
              />
            </div>
            <div className="form-text">
              Total income tax deducted from your payslips
            </div>
          </div>

          <div className="col-12 col-md-6">
            <label htmlFor="niPaid" className="form-label fw-bold">
              National Insurance Paid
            </label>
            <div className="input-group">
              <span className="input-group-text">£</span>
              <input
                type="number"
                className="form-control"
                id="niPaid"
                value={data.niPaid || ''}
                onChange={(e) => handleInputChange('niPaid', e.target.value)}
                min="0"
                step="0.01"
                placeholder="0"
              />
            </div>
            <div className="form-text">
              Total NI contributions from your payslips
            </div>
          </div>

          <div className="col-12 col-md-6">
            <label htmlFor="studentLoanDeductions" className="form-label fw-bold">
              Student Loan Deductions
            </label>
            <div className="input-group">
              <span className="input-group-text">£</span>
              <input
                type="number"
                className="form-control"
                id="studentLoanDeductions"
                value={data.studentLoanDeductions || ''}
                onChange={(e) => handleInputChange('studentLoanDeductions', e.target.value)}
                min="0"
                step="0.01"
                placeholder="0"
              />
            </div>
            <div className="form-text">
              Student loan repayments deducted from salary
            </div>
          </div>

          {/* Pension Section */}
          <div className="col-12 mt-4">
            <h6 className="text-success border-bottom pb-2">
              <i className="fas fa-umbrella me-2"></i>
              Pension Contributions
            </h6>
          </div>

          <div className="col-12 col-md-6">
            <label htmlFor="employeePensionContributions" className="form-label fw-bold">
              Employee Pension Contributions
            </label>
            <div className="input-group">
              <span className="input-group-text">£</span>
              <input
                type="number"
                className="form-control"
                id="employeePensionContributions"
                value={data.employeePensionContributions || ''}
                onChange={(e) => handleInputChange('employeePensionContributions', e.target.value)}
                min="0"
                step="0.01"
                placeholder="0"
              />
            </div>
            <div className="form-text">
              Your pension contributions (reduces taxable income)
            </div>
          </div>

          <div className="col-12 col-md-6">
            <label htmlFor="employerPensionContributions" className="form-label fw-bold">
              Employer Pension Contributions
            </label>
            <div className="input-group">
              <span className="input-group-text">£</span>
              <input
                type="number"
                className="form-control"
                id="employerPensionContributions"
                value={data.employerPensionContributions || ''}
                onChange={(e) => handleInputChange('employerPensionContributions', e.target.value)}
                min="0"
                step="0.01"
                placeholder="0"
              />
            </div>
            <div className="form-text">
              Employer contributions (informational)
            </div>
          </div>

          {/* Summary */}
          <div className="col-12 mt-4">
            <div className="card bg-light border-0">
              <div className="card-body">
                <h6 className="card-title">
                  <i className="fas fa-calculator me-2 text-success"></i>
                  Income Summary
                </h6>
                <div className="row g-2">
                  <div className="col-6 col-md-3">
                    <div className="small text-muted">Gross Income</div>
                    <div className="fw-bold text-success">
                      {new Intl.NumberFormat('en-GB', {
                        style: 'currency',
                        currency: 'GBP'
                      }).format(grossIncome)}
                    </div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="small text-muted">Deductions</div>
                    <div className="fw-bold text-danger">
                      -{new Intl.NumberFormat('en-GB', {
                        style: 'currency',
                        currency: 'GBP'
                      }).format(totalDeductions)}
                    </div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="small text-muted">Net Income</div>
                    <div className="fw-bold text-primary">
                      {new Intl.NumberFormat('en-GB', {
                        style: 'currency',
                        currency: 'GBP'
                      }).format(netIncome)}
                    </div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="small text-muted">Pension Relief</div>
                    <div className="fw-bold text-info">
                      {new Intl.NumberFormat('en-GB', {
                        style: 'currency',
                        currency: 'GBP'
                      }).format(data.employeePensionContributions)}
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
