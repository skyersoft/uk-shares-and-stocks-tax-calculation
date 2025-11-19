import React from 'react';
import { PersonalTaxDetails } from '../../../types/calculator';

interface PersonalDetailsStepProps {
  personalDetails: PersonalTaxDetails;
  onChange: (details: PersonalTaxDetails) => void;
}

export const PersonalDetailsStep: React.FC<PersonalDetailsStepProps> = ({
  personalDetails,
  onChange
}) => {
  const handleChange = (field: keyof PersonalTaxDetails, value: any) => {
    onChange({ ...personalDetails, [field]: value });
  };

  const currentTaxYear = new Date().getFullYear();
  const maxAge = 100;
  const minBirthYear = currentTaxYear - maxAge;

  return (
    <div className="personal-details-step">
      <div className="row g-4">
        {/* Tax Residency */}
        <div className="col-12">
          <h5 className="mb-3">
            <i className="fas fa-map-marker-alt me-2 text-primary"></i>
            Tax Residency
          </h5>
          <div className="card border-primary">
            <div className="card-body">
              <label className="form-label fw-bold">
                Where are you tax resident?
                <span className="text-danger">*</span>
              </label>
              <div className="row g-2">
                <div className="col-12 col-md-6">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="taxResidency"
                      id="residencyEngland"
                      value="england-wales-ni"
                      checked={personalDetails.taxResidency === 'england-wales-ni'}
                      onChange={(e) => handleChange('taxResidency', e.target.value)}
                    />
                    <label className="form-check-label" htmlFor="residencyEngland">
                      <strong>England, Wales, or Northern Ireland</strong>
                      <div className="small text-muted">
                        Standard UK tax bands (20%, 40%, 45%)
                      </div>
                    </label>
                  </div>
                </div>
                <div className="col-12 col-md-6">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="taxResidency"
                      id="residencyScotland"
                      value="scotland"
                      checked={personalDetails.taxResidency === 'scotland'}
                      onChange={(e) => handleChange('taxResidency', e.target.value)}
                    />
                    <label className="form-check-label" htmlFor="residencyScotland">
                      <strong>Scotland</strong>
                      <div className="small text-muted">
                        Scottish tax bands (19%, 20%, 21%, 42%, 47%)
                      </div>
                    </label>
                  </div>
                </div>
              </div>
              <div className="alert alert-info mt-3 mb-0" role="alert">
                <i className="fas fa-info-circle me-2"></i>
                <small>
                  Tax residency affects your income tax rates. Scotland has different tax bands than the rest of the UK.
                </small>
              </div>
            </div>
          </div>
        </div>

        {/* Date of Birth */}
        <div className="col-12 col-md-6">
          <label htmlFor="dateOfBirth" className="form-label fw-bold">
            <i className="fas fa-birthday-cake me-2 text-primary"></i>
            Date of Birth
            <span className="text-danger">*</span>
          </label>
          <input
            type="date"
            className="form-control"
            id="dateOfBirth"
            value={personalDetails.dateOfBirth}
            onChange={(e) => handleChange('dateOfBirth', e.target.value)}
            min={`${minBirthYear}-01-01`}
            max={new Date().toISOString().split('T')[0]}
          />
          <div className="form-text">
            Used to verify eligibility for age-related allowances (currently informational)
          </div>
        </div>

        {/* Tax Code (Optional) */}
        <div className="col-12 col-md-6">
          <label htmlFor="taxCode" className="form-label fw-bold">
            <i className="fas fa-hashtag me-2 text-primary"></i>
            Tax Code (Optional)
          </label>
          <input
            type="text"
            className="form-control"
            id="taxCode"
            value={personalDetails.taxCode || ''}
            onChange={(e) => handleChange('taxCode', e.target.value)}
            placeholder="e.g., 1257L"
            maxLength={10}
          />
          <div className="form-text">
            Your tax code from your payslip (if employed)
          </div>
        </div>

        {/* Allowances & Claims */}
        <div className="col-12">
          <h5 className="mb-3 mt-2">
            <i className="fas fa-gift me-2 text-primary"></i>
            Allowances & Claims
          </h5>
          <div className="card">
            <div className="card-body">
              <div className="row g-3">
                {/* Marriage Allowance */}
                <div className="col-12">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="claimMarriageAllowance"
                      checked={personalDetails.claimMarriageAllowance}
                      onChange={(e) => handleChange('claimMarriageAllowance', e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="claimMarriageAllowance">
                      <strong>Claim Marriage Allowance</strong>
                      <div className="small text-muted">
                        Transfer £1,260 of your personal allowance to your spouse/civil partner.
                        Only available if your income is below the personal allowance and your partner
                        is a basic rate taxpayer.
                      </div>
                    </label>
                  </div>
                </div>

                {/* Blind Person's Allowance */}
                <div className="col-12">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="claimBlindPersonAllowance"
                      checked={personalDetails.claimBlindPersonAllowance}
                      onChange={(e) => handleChange('claimBlindPersonAllowance', e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="claimBlindPersonAllowance">
                      <strong>Claim Blind Person's Allowance</strong>
                      <div className="small text-muted">
                        Additional £3,070 allowance if you're registered blind or severely sight impaired.
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Carried Forward Losses */}
        <div className="col-12">
          <h5 className="mb-3 mt-2">
            <i className="fas fa-chart-line me-2 text-primary"></i>
            Capital Gains Losses
          </h5>
          <div className="card">
            <div className="card-body">
              <label htmlFor="carriedForwardLosses" className="form-label fw-bold">
                Carried Forward Losses from Previous Years
              </label>
              <div className="input-group">
                <span className="input-group-text">£</span>
                <input
                  type="number"
                  className="form-control"
                  id="carriedForwardLosses"
                  value={personalDetails.carriedForwardLosses || ''}
                  onChange={(e) => {
                    const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                    if (!isNaN(value) && value >= 0) {
                      handleChange('carriedForwardLosses', value);
                    }
                  }}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>
              <div className="form-text">
                <i className="fas fa-info-circle me-1"></i>
                Capital losses from previous tax years that you haven't used yet.
                These can reduce your capital gains tax liability.
              </div>
              
              {personalDetails.carriedForwardLosses > 0 && (
                <div className="alert alert-success mt-3 mb-0" role="alert">
                  <i className="fas fa-check-circle me-2"></i>
                  <small>
                    <strong>Tax Benefit:</strong> Your carried forward losses of{' '}
                    {new Intl.NumberFormat('en-GB', {
                      style: 'currency',
                      currency: 'GBP'
                    }).format(personalDetails.carriedForwardLosses)}{' '}
                    will reduce your capital gains before tax is calculated.
                  </small>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Charitable Donations (Gift Aid) */}
        <div className="col-12">
          <h5 className="mb-3 mt-2">
            <i className="fas fa-hand-holding-heart me-2 text-primary"></i>
            Charitable Donations
          </h5>
          <div className="card border-success">
            <div className="card-body">
              <label htmlFor="charitableDonations" className="form-label fw-bold">
                Gift Aid Donations Made This Tax Year
              </label>
              <div className="input-group">
                <span className="input-group-text">£</span>
                <input
                  type="number"
                  className="form-control"
                  id="charitableDonations"
                  value={personalDetails.charitableDonations || ''}
                  onChange={(e) => {
                    const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                    if (!isNaN(value) && value >= 0) {
                      handleChange('charitableDonations', value);
                    }
                  }}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>
              <div className="form-text">
                <i className="fas fa-info-circle me-1"></i>
                Donations to UK charities through Gift Aid. The charity claims 25% tax back,
                and higher rate taxpayers can claim additional relief.
              </div>
              
              {personalDetails.charitableDonations > 0 && (
                <div className="alert alert-info mt-3 mb-0" role="alert">
                  <i className="fas fa-lightbulb me-2"></i>
                  <small>
                    <strong>How Gift Aid Works:</strong>
                    <ul className="mb-0 mt-2">
                      <li>
                        Your £{new Intl.NumberFormat('en-GB').format(personalDetails.charitableDonations)} donation
                        becomes £{new Intl.NumberFormat('en-GB').format(personalDetails.charitableDonations * 1.25)} 
                        {' '}for the charity (25% basic rate tax reclaimed)
                      </li>
                      <li>
                        If you're a higher rate (40%) or additional rate (45%) taxpayer, you can claim
                        the difference between the higher rate and basic rate
                      </li>
                      <li>
                        Your basic rate tax band is extended by £
                        {new Intl.NumberFormat('en-GB').format(personalDetails.charitableDonations * 1.25)},
                        potentially saving you tax on income that would otherwise be taxed at higher rates
                      </li>
                    </ul>
                  </small>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Self Assessment Status */}
        <div className="col-12">
          <h5 className="mb-3 mt-2">
            <i className="fas fa-file-invoice me-2 text-primary"></i>
            Self Assessment
          </h5>
          <div className="card">
            <div className="card-body">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="isRegisteredForSelfAssessment"
                  checked={personalDetails.isRegisteredForSelfAssessment}
                  onChange={(e) => handleChange('isRegisteredForSelfAssessment', e.target.checked)}
                />
                <label className="form-check-label" htmlFor="isRegisteredForSelfAssessment">
                  <strong>I am registered for Self Assessment</strong>
                  <div className="small text-muted">
                    If you're already registered, you'll need to report these calculations in your
                    Self Assessment tax return.
                  </div>
                </label>
              </div>
              
              {!personalDetails.isRegisteredForSelfAssessment && (
                <div className="alert alert-warning mt-3 mb-0" role="alert">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  <small>
                    <strong>Note:</strong> You may need to register for Self Assessment if you have
                    significant investment income, capital gains, or other untaxed income.
                    Visit{' '}
                    <a
                      href="https://www.gov.uk/self-assessment-tax-returns"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="alert-link"
                    >
                      gov.uk/self-assessment-tax-returns
                    </a>{' '}
                    for more information.
                  </small>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Information Panel */}
        <div className="col-12">
          <div className="alert alert-info mb-0" role="alert">
            <h6 className="alert-heading">
              <i className="fas fa-shield-alt me-2"></i>
              Privacy & Security
            </h6>
            <p className="mb-0 small">
              All personal information entered here is processed locally in your browser and is never
              stored on our servers. Your data is used only for tax calculations and is not retained
              after you close this page.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
