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
      <div className="row g-3">
        {/* Tax Residency */}
        <div className="col-12">
          <label className="form-label fw-semibold small mb-1">
            <i className="fas fa-map-marker-alt me-1 text-primary"></i>
            Tax Residency <span className="text-danger">*</span>
          </label>
          <div className="row g-2">
            <div className="col-12 col-md-6">
              <div
                className={`d-flex align-items-start rounded border p-2 ${personalDetails.taxResidency === 'england-wales-ni' ? 'border-primary bg-primary bg-opacity-10' : ''}`}
                style={{ cursor: 'pointer' }}
                onClick={() => handleChange('taxResidency', 'england-wales-ni')}
              >
                <input
                  className="form-check-input mt-0 me-2 flex-shrink-0"
                  type="radio"
                  name="taxResidency"
                  id="residencyEngland"
                  value="england-wales-ni"
                  checked={personalDetails.taxResidency === 'england-wales-ni'}
                  onChange={(e) => handleChange('taxResidency', e.target.value)}
                />
                <label className="form-check-label small" htmlFor="residencyEngland" style={{ cursor: 'pointer' }}>
                  <strong>England, Wales or Northern Ireland</strong>
                  <span className="text-muted ms-1">(20%, 40%, 45%)</span>
                </label>
              </div>
            </div>
            <div className="col-12 col-md-6">
              <div
                className={`d-flex align-items-start rounded border p-2 ${personalDetails.taxResidency === 'scotland' ? 'border-primary bg-primary bg-opacity-10' : ''}`}
                style={{ cursor: 'pointer' }}
                onClick={() => handleChange('taxResidency', 'scotland')}
              >
                <input
                  className="form-check-input mt-0 me-2 flex-shrink-0"
                  type="radio"
                  name="taxResidency"
                  id="residencyScotland"
                  value="scotland"
                  checked={personalDetails.taxResidency === 'scotland'}
                  onChange={(e) => handleChange('taxResidency', e.target.value)}
                />
                <label className="form-check-label small" htmlFor="residencyScotland" style={{ cursor: 'pointer' }}>
                  <strong>Scotland</strong>
                  <span className="text-muted ms-1">(19%, 20%, 21%, 42%, 47%)</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Date of Birth + Tax Code — same row */}
        <div className="col-12 col-md-6">
          <label htmlFor="dateOfBirth" className="form-label fw-semibold small mb-1">
            <i className="fas fa-birthday-cake me-1 text-primary"></i>
            Date of Birth <span className="text-danger">*</span>
          </label>
          <input
            type="date"
            className="form-control form-control-sm"
            id="dateOfBirth"
            value={personalDetails.dateOfBirth}
            onChange={(e) => handleChange('dateOfBirth', e.target.value)}
            min={`${minBirthYear}-01-01`}
            max={new Date().toISOString().split('T')[0]}
          />
          <div className="form-text" style={{ fontSize: '0.72rem' }}>Used for age-related allowances</div>
        </div>

        <div className="col-12 col-md-6">
          <label htmlFor="taxCode" className="form-label fw-semibold small mb-1">
            <i className="fas fa-hashtag me-1 text-primary"></i>
            Tax Code <span className="text-muted fw-normal">(optional)</span>
          </label>
          <input
            type="text"
            className="form-control form-control-sm"
            id="taxCode"
            value={personalDetails.taxCode || ''}
            onChange={(e) => handleChange('taxCode', e.target.value)}
            placeholder="e.g., 1257L"
            maxLength={10}
          />
          <div className="form-text" style={{ fontSize: '0.72rem' }}>From your payslip (if employed)</div>
        </div>

        {/* Allowances — compact inline checkboxes */}
        <div className="col-12">
          <div className="small fw-semibold mb-1">
            <i className="fas fa-gift me-1 text-primary"></i>Allowances &amp; Claims
          </div>
          <div className="d-flex flex-wrap gap-3">
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                id="claimMarriageAllowance"
                checked={personalDetails.claimMarriageAllowance}
                onChange={(e) => handleChange('claimMarriageAllowance', e.target.checked)}
              />
              <label className="form-check-label small" htmlFor="claimMarriageAllowance">
                Marriage Allowance <span className="text-muted">(+£1,260 transfer)</span>
              </label>
            </div>
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                id="claimBlindPersonAllowance"
                checked={personalDetails.claimBlindPersonAllowance}
                onChange={(e) => handleChange('claimBlindPersonAllowance', e.target.checked)}
              />
              <label className="form-check-label small" htmlFor="claimBlindPersonAllowance">
                Blind Person's Allowance <span className="text-muted">(+£3,070)</span>
              </label>
            </div>
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                id="isRegisteredForSelfAssessment"
                checked={personalDetails.isRegisteredForSelfAssessment}
                onChange={(e) => handleChange('isRegisteredForSelfAssessment', e.target.checked)}
              />
              <label className="form-check-label small" htmlFor="isRegisteredForSelfAssessment">
                Registered for Self Assessment
              </label>
            </div>
          </div>
        </div>

        {/* Carried Forward Losses + Charitable Donations — same row */}
        <div className="col-12 col-md-6">
          <label htmlFor="carriedForwardLosses" className="form-label fw-semibold small mb-1">
            <i className="fas fa-chart-line me-1 text-primary"></i>
            Carried Forward Losses
          </label>
          <div className="input-group input-group-sm">
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
          <div className="form-text" style={{ fontSize: '0.72rem' }}>CGT losses from previous years</div>
        </div>

        <div className="col-12 col-md-6">
          <label htmlFor="charitableDonations" className="form-label fw-semibold small mb-1">
            <i className="fas fa-hand-holding-heart me-1 text-primary"></i>
            Gift Aid Donations
          </label>
          <div className="input-group input-group-sm">
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
          <div className="form-text" style={{ fontSize: '0.72rem' }}>Donations to UK charities this tax year</div>
        </div>


      </div>
    </div>
  );
};
