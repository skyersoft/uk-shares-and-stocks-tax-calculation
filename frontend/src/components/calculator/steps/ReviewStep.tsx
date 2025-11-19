import React from 'react';
import { WizardData } from '../../../types/calculator';
import { Button } from '../../ui/Button';

interface ReviewStepProps {
  data: WizardData;
  onEdit: (step: number) => void;
  onCalculate: () => void;
}

export const ReviewStep: React.FC<ReviewStepProps> = ({ data, onEdit, onCalculate }) => {
  const { incomeSources, brokerFiles, employmentIncome, rentalIncome, savingsInterest, otherDividends, otherCapitalGains, personalDetails } = data;

  // Calculate totals
  const totalPropertyGains = otherCapitalGains?.propertyGains.reduce((sum, g) => 
    sum + (g.disposalProceeds - g.acquisitionCost - g.improvementCosts - g.sellingCosts), 0) || 0;
  const totalCryptoGains = otherCapitalGains?.cryptoGains.reduce((sum, g) => 
    sum + (g.disposalProceeds - g.acquisitionCost), 0) || 0;
  const totalOtherGains = otherCapitalGains?.otherGains.reduce((sum, g) => 
    sum + (g.disposalProceeds - g.acquisitionCost - g.costs), 0) || 0;

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(amount);

  return (
    <div className="review-step">
      <div className="alert alert-primary mb-4" role="alert">
        <i className="fas fa-check-circle me-2"></i>
        <strong>Almost there!</strong> Please review your information before we calculate your tax liability.
      </div>

      {/* Income Sources Summary */}
      <div className="card mb-4">
        <div className="card-header bg-light d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <i className="fas fa-list-check me-2"></i>
            Income Sources
          </h5>
          <Button variant="outline-primary" size="sm" onClick={() => onEdit(1)}>
            <i className="fas fa-edit me-1"></i> Edit
          </Button>
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <div className="small text-muted">Tax Year</div>
              <div className="fw-bold">{data.taxYear}</div>
            </div>
            <div className="col-md-4">
              <div className="small text-muted">Analysis Type</div>
              <div className="fw-bold text-capitalize">{data.analysisType}</div>
            </div>
            <div className="col-md-4">
              <div className="small text-muted">Selected Sources</div>
              <div className="fw-bold">
                {Object.values(incomeSources).filter(Boolean).length} source(s)
              </div>
            </div>
          </div>
          <hr />
          <div className="row g-2">
            {incomeSources.investmentPortfolio && (
              <div className="col-md-6">
                <i className="fas fa-check text-success me-2"></i>
                Investment Portfolio
              </div>
            )}
            {incomeSources.employmentIncome && (
              <div className="col-md-6">
                <i className="fas fa-check text-success me-2"></i>
                Employment Income
              </div>
            )}
            {incomeSources.selfEmploymentIncome && (
              <div className="col-md-6">
                <i className="fas fa-check text-success me-2"></i>
                Self-Employment
              </div>
            )}
            {incomeSources.rentalIncome && (
              <div className="col-md-6">
                <i className="fas fa-check text-success me-2"></i>
                Rental Income
              </div>
            )}
            {incomeSources.savingsInterest && (
              <div className="col-md-6">
                <i className="fas fa-check text-success me-2"></i>
                Savings Interest
              </div>
            )}
            {incomeSources.otherDividends && (
              <div className="col-md-6">
                <i className="fas fa-check text-success me-2"></i>
                Other Dividends
              </div>
            )}
            {incomeSources.otherCapitalGains && (
              <div className="col-md-6">
                <i className="fas fa-check text-success me-2"></i>
                Other Capital Gains
              </div>
            )}
            {incomeSources.pensionContributions && (
              <div className="col-md-6">
                <i className="fas fa-check text-success me-2"></i>
                Pension Contributions
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload & Details Summary */}
      <div className="card mb-4">
        <div className="card-header bg-light d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <i className="fas fa-upload me-2"></i>
            Upload & Income Details
          </h5>
          <Button variant="outline-primary" size="sm" onClick={() => onEdit(2)}>
            <i className="fas fa-edit me-1"></i> Edit
          </Button>
        </div>
        <div className="card-body">
          {/* Files */}
          {brokerFiles.length > 0 && (
            <div className="mb-3">
              <h6 className="text-primary mb-2">
                <i className="fas fa-file me-2"></i>
                Uploaded Files ({brokerFiles.length})
              </h6>
              <div className="list-group list-group-flush">
                {brokerFiles.map((file) => (
                  <div key={file.id} className="list-group-item px-0">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <div className="fw-bold">{file.file.name}</div>
                        <div className="small text-muted">
                          {file.broker.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                          {file.accountName && ` - ${file.accountName}`}
                        </div>
                      </div>
                      <span className="badge bg-secondary">
                        {(file.file.size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Employment Income */}
          {employmentIncome && (employmentIncome.grossSalary > 0 || employmentIncome.bonuses > 0) && (
            <div className="mb-3">
              <h6 className="text-success mb-2">
                <i className="fas fa-briefcase me-2"></i>
                Employment Income
              </h6>
              <div className="row g-2">
                <div className="col-6">
                  <div className="small text-muted">Gross Salary</div>
                  <div>{formatCurrency(employmentIncome.grossSalary)}</div>
                </div>
                <div className="col-6">
                  <div className="small text-muted">Bonuses</div>
                  <div>{formatCurrency(employmentIncome.bonuses)}</div>
                </div>
                <div className="col-6">
                  <div className="small text-muted">PAYE Tax Paid</div>
                  <div>{formatCurrency(employmentIncome.payeTaxPaid)}</div>
                </div>
                <div className="col-6">
                  <div className="small text-muted">NI Paid</div>
                  <div>{formatCurrency(employmentIncome.niPaid)}</div>
                </div>
              </div>
            </div>
          )}

          {/* Rental Income */}
          {rentalIncome && rentalIncome.grossRentalIncome > 0 && (
            <div className="mb-3">
              <h6 className="text-warning mb-2">
                <i className="fas fa-home me-2"></i>
                Rental Income
              </h6>
              <div className="row g-2">
                <div className="col-6">
                  <div className="small text-muted">Gross Rental Income</div>
                  <div>{formatCurrency(rentalIncome.grossRentalIncome)}</div>
                </div>
                <div className="col-6">
                  <div className="small text-muted">Method</div>
                  <div>{rentalIncome.usePropertyAllowance ? 'Property Allowance' : 'Expenses'}</div>
                </div>
              </div>
            </div>
          )}

          {/* Savings Interest */}
          {savingsInterest && savingsInterest.totalInterest > 0 && (
            <div className="mb-3">
              <h6 className="text-info mb-2">
                <i className="fas fa-piggy-bank me-2"></i>
                Savings Interest
              </h6>
              <div className="small text-muted">Total Interest</div>
              <div>{formatCurrency(savingsInterest.totalInterest)}</div>
            </div>
          )}

          {/* Other Dividends */}
          {otherDividends && (otherDividends.ukDividends > 0 || otherDividends.foreignDividends > 0) && (
            <div className="mb-3">
              <h6 className="text-purple mb-2">
                <i className="fas fa-money-bill-wave me-2"></i>
                Other Dividends
              </h6>
              <div className="row g-2">
                <div className="col-6">
                  <div className="small text-muted">UK Dividends</div>
                  <div>{formatCurrency(otherDividends.ukDividends)}</div>
                </div>
                <div className="col-6">
                  <div className="small text-muted">Foreign Dividends</div>
                  <div>{formatCurrency(otherDividends.foreignDividends)}</div>
                </div>
              </div>
            </div>
          )}

          {/* Other Capital Gains */}
          {otherCapitalGains && (totalPropertyGains + totalCryptoGains + totalOtherGains !== 0) && (
            <div className="mb-3">
              <h6 className="text-dark mb-2">
                <i className="fas fa-coins me-2"></i>
                Other Capital Gains
              </h6>
              <div className="row g-2">
                {totalPropertyGains !== 0 && (
                  <div className="col-4">
                    <div className="small text-muted">Property</div>
                    <div>{formatCurrency(totalPropertyGains)}</div>
                  </div>
                )}
                {totalCryptoGains !== 0 && (
                  <div className="col-4">
                    <div className="small text-muted">Crypto</div>
                    <div>{formatCurrency(totalCryptoGains)}</div>
                  </div>
                )}
                {totalOtherGains !== 0 && (
                  <div className="col-4">
                    <div className="small text-muted">Other</div>
                    <div>{formatCurrency(totalOtherGains)}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {brokerFiles.length === 0 && !employmentIncome && !rentalIncome && !savingsInterest && !otherDividends && !otherCapitalGains && (
            <div className="text-muted text-center py-3">
              <i className="fas fa-info-circle me-2"></i>
              No files or income details added
            </div>
          )}
        </div>
      </div>

      {/* Personal Details Summary */}
      <div className="card mb-4">
        <div className="card-header bg-light d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <i className="fas fa-user me-2"></i>
            Personal Tax Details
          </h5>
          <Button variant="outline-primary" size="sm" onClick={() => onEdit(3)}>
            <i className="fas fa-edit me-1"></i> Edit
          </Button>
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6">
              <div className="small text-muted">Tax Residency</div>
              <div className="fw-bold">
                {personalDetails.taxResidency === 'scotland' ? 'Scotland' : 'England, Wales & Northern Ireland'}
              </div>
            </div>
            {personalDetails.dateOfBirth && (
              <div className="col-md-6">
                <div className="small text-muted">Date of Birth</div>
                <div className="fw-bold">{new Date(personalDetails.dateOfBirth).toLocaleDateString('en-GB')}</div>
              </div>
            )}
            <div className="col-md-6">
              <div className="small text-muted">Marriage Allowance</div>
              <div className="fw-bold">{personalDetails.claimMarriageAllowance ? 'Yes' : 'No'}</div>
            </div>
            <div className="col-md-6">
              <div className="small text-muted">Blind Person's Allowance</div>
              <div className="fw-bold">{personalDetails.claimBlindPersonAllowance ? 'Yes' : 'No'}</div>
            </div>
            {personalDetails.carriedForwardLosses > 0 && (
              <div className="col-md-6">
                <div className="small text-muted">Carried Forward Losses</div>
                <div className="fw-bold">{formatCurrency(personalDetails.carriedForwardLosses)}</div>
              </div>
            )}
            {personalDetails.charitableDonations > 0 && (
              <div className="col-md-6">
                <div className="small text-muted">Charitable Donations (Gift Aid)</div>
                <div className="fw-bold">
                  {formatCurrency(personalDetails.charitableDonations)}
                  <span className="small text-success ms-2">
                    <i className="fas fa-info-circle me-1"></i>
                    Tax relief applied
                  </span>
                </div>
              </div>
            )}
            <div className="col-md-6">
              <div className="small text-muted">Self Assessment Registered</div>
              <div className="fw-bold">{personalDetails.isRegisteredForSelfAssessment ? 'Yes' : 'No'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Calculate Button */}
      <div className="card bg-primary text-white">
        <div className="card-body">
          <div className="row align-items-center">
            <div className="col-md-8">
              <h5 className="mb-2">
                <i className="fas fa-calculator me-2"></i>
                Ready to Calculate
              </h5>
              <p className="mb-0">
                We'll process your files, apply UK tax rules for {data.taxYear}, and generate a comprehensive tax report
                with breakdowns by income source.
              </p>
            </div>
            <div className="col-md-4 text-md-end mt-3 mt-md-0">
              <Button variant="light" size="lg" onClick={onCalculate}>
                <i className="fas fa-play me-2"></i>
                Calculate Tax
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="alert alert-info mt-4 mb-0" role="alert">
        <i className="fas fa-lightbulb me-2"></i>
        <strong>Tip:</strong> If any information above is incorrect, use the Edit buttons to go back and make changes.
      </div>
    </div>
  );
};
