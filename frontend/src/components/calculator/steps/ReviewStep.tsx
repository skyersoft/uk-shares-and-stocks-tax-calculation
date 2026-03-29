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

  const totalPropertyGains = otherCapitalGains?.propertyGains.reduce((sum, g) =>
    sum + (g.disposalProceeds - g.acquisitionCost - g.improvementCosts - g.sellingCosts), 0) || 0;
  const totalCryptoGains = otherCapitalGains?.cryptoGains.reduce((sum, g) =>
    sum + (g.disposalProceeds - g.acquisitionCost), 0) || 0;
  const totalOtherGains = otherCapitalGains?.otherGains.reduce((sum, g) =>
    sum + (g.disposalProceeds - g.acquisitionCost - g.costs), 0) || 0;

  const fmt = (n: number) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(n);

  const selectedSources = Object.entries({
    'Investment Portfolio': incomeSources.investmentPortfolio,
    'Employment': incomeSources.employmentIncome,
    'Self-Employment': incomeSources.selfEmploymentIncome,
    'Dividends': incomeSources.otherDividends,
    'Rental': incomeSources.rentalIncome,
    'Savings': incomeSources.savingsInterest,
    'Capital Gains': incomeSources.otherCapitalGains,
    'Pension': incomeSources.pensionContributions,
  }).filter(([, v]) => v).map(([k]) => k);

  return (
    <div className="review-step">
      {/* Compact 2-col summary grid */}
      <div className="row g-2 mb-2">

        {/* Col 1: Income Sources + Files */}
        <div className="col-md-6">
          {/* Section 1: Income Sources */}
          <div className="border rounded p-2 mb-2" style={{ fontSize: '0.82rem' }}>
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="fw-semibold text-primary">
                <i className="fas fa-list-check me-1"></i>Income Sources
              </span>
              <button className="btn btn-link btn-sm p-0 text-primary" style={{ fontSize: '0.75rem' }} onClick={() => onEdit(1)}>
                <i className="fas fa-edit me-1"></i>Edit
              </button>
            </div>
            <div className="d-flex gap-3 mb-1">
              <span className="text-muted">Tax Year: <strong>{data.taxYear}</strong></span>
              <span className="text-muted">Analysis: <strong className="text-capitalize">{data.analysisType?.replace('_', ' ')}</strong></span>
            </div>
            <div className="d-flex flex-wrap gap-1">
              {selectedSources.map(s => (
                <span key={s} className="badge bg-success bg-opacity-75" style={{ fontSize: '0.7rem' }}>{s}</span>
              ))}
              {selectedSources.length === 0 && <span className="text-muted">None selected</span>}
            </div>
          </div>

          {/* Section 2: Files */}
          <div className="border rounded p-2" style={{ fontSize: '0.82rem' }}>
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="fw-semibold text-primary">
                <i className="fas fa-upload me-1"></i>Files &amp; Income
              </span>
              <button className="btn btn-link btn-sm p-0 text-primary" style={{ fontSize: '0.75rem' }} onClick={() => onEdit(2)}>
                <i className="fas fa-edit me-1"></i>Edit
              </button>
            </div>

            {brokerFiles.length > 0 && (
              <div className="mb-1">
                {brokerFiles.map(f => (
                  <div key={f.id} className="d-flex justify-content-between align-items-center py-1 border-bottom">
                    <span className="text-truncate me-2" style={{ maxWidth: '70%' }}>
                      <i className="fas fa-file-alt text-muted me-1"></i>{f.file.name}
                    </span>
                    <span className="badge bg-secondary" style={{ fontSize: '0.68rem' }}>{(f.file.size / 1024).toFixed(0)} KB</span>
                  </div>
                ))}
              </div>
            )}

            {employmentIncome && employmentIncome.grossSalary > 0 && (
              <div className="d-flex justify-content-between py-1 border-bottom">
                <span className="text-muted">Salary</span>
                <strong>{fmt(employmentIncome.grossSalary)}</strong>
              </div>
            )}
            {rentalIncome && rentalIncome.grossRentalIncome > 0 && (
              <div className="d-flex justify-content-between py-1 border-bottom">
                <span className="text-muted">Rental</span>
                <strong>{fmt(rentalIncome.grossRentalIncome)}</strong>
              </div>
            )}
            {savingsInterest && savingsInterest.totalInterest > 0 && (
              <div className="d-flex justify-content-between py-1 border-bottom">
                <span className="text-muted">Savings interest</span>
                <strong>{fmt(savingsInterest.totalInterest)}</strong>
              </div>
            )}
            {otherDividends && (otherDividends.ukDividends > 0 || otherDividends.foreignDividends > 0) && (
              <div className="d-flex justify-content-between py-1 border-bottom">
                <span className="text-muted">Dividends</span>
                <strong>{fmt((otherDividends.ukDividends || 0) + (otherDividends.foreignDividends || 0))}</strong>
              </div>
            )}
            {otherCapitalGains && (totalPropertyGains + totalCryptoGains + totalOtherGains !== 0) && (
              <div className="d-flex justify-content-between py-1 border-bottom">
                <span className="text-muted">Other gains</span>
                <strong>{fmt(totalPropertyGains + totalCryptoGains + totalOtherGains)}</strong>
              </div>
            )}
            {brokerFiles.length === 0 && !employmentIncome && !rentalIncome && !savingsInterest && (
              <span className="text-muted">No files or income added</span>
            )}
          </div>
        </div>

        {/* Col 2: Personal Details + CTA */}
        <div className="col-md-6 d-flex flex-column">
          {/* Section 3: Personal Details */}
          <div className="border rounded p-2 mb-2 flex-grow-1" style={{ fontSize: '0.82rem' }}>
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="fw-semibold text-primary">
                <i className="fas fa-user me-1"></i>Personal Details
              </span>
              <button className="btn btn-link btn-sm p-0 text-primary" style={{ fontSize: '0.75rem' }} onClick={() => onEdit(3)}>
                <i className="fas fa-edit me-1"></i>Edit
              </button>
            </div>
            <div className="d-flex justify-content-between py-1 border-bottom">
              <span className="text-muted">Residency</span>
              <strong>{personalDetails.taxResidency === 'scotland' ? 'Scotland' : 'England / Wales / NI'}</strong>
            </div>
            {personalDetails.dateOfBirth && (
              <div className="d-flex justify-content-between py-1 border-bottom">
                <span className="text-muted">Date of Birth</span>
                <strong>{new Date(personalDetails.dateOfBirth).toLocaleDateString('en-GB')}</strong>
              </div>
            )}
            {personalDetails.taxCode && (
              <div className="d-flex justify-content-between py-1 border-bottom">
                <span className="text-muted">Tax Code</span>
                <strong>{personalDetails.taxCode}</strong>
              </div>
            )}
            <div className="d-flex justify-content-between py-1 border-bottom">
              <span className="text-muted">Marriage Allowance</span>
              <strong>{personalDetails.claimMarriageAllowance ? '✓ Yes' : 'No'}</strong>
            </div>
            <div className="d-flex justify-content-between py-1 border-bottom">
              <span className="text-muted">Blind Person's Allowance</span>
              <strong>{personalDetails.claimBlindPersonAllowance ? '✓ Yes' : 'No'}</strong>
            </div>
            {personalDetails.carriedForwardLosses > 0 && (
              <div className="d-flex justify-content-between py-1 border-bottom">
                <span className="text-muted">Losses c/f</span>
                <strong>{fmt(personalDetails.carriedForwardLosses)}</strong>
              </div>
            )}
            {personalDetails.charitableDonations > 0 && (
              <div className="d-flex justify-content-between py-1 border-bottom">
                <span className="text-muted">Gift Aid donations</span>
                <strong>{fmt(personalDetails.charitableDonations)}</strong>
              </div>
            )}
            <div className="d-flex justify-content-between py-1">
              <span className="text-muted">Self Assessment</span>
              <strong>{personalDetails.isRegisteredForSelfAssessment ? '✓ Registered' : 'Not registered'}</strong>
            </div>
          </div>

          {/* CTA */}
          <div className="rounded p-2 bg-primary text-white text-center">
            <div className="small mb-2 opacity-75">
              <i className="fas fa-calculator me-1"></i>
              Ready to calculate tax for <strong>{data.taxYear}</strong>
            </div>
            <Button variant="light" size="sm" onClick={onCalculate} className="w-100">
              <i className="fas fa-play me-2"></i>Calculate Tax
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
