import React, { useState } from 'react';
import { ProgressIndicator } from './ProgressIndicator';
import { WizardData, WizardStep, WIZARD_STEPS } from '../../types/calculator';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import { IncomeSourcesStep } from './steps/IncomeSourcesStep';
import { UploadDetailsStep } from './steps/UploadDetailsStep';
import { PersonalDetailsStep } from './steps/PersonalDetailsStep';
import { ReviewStep } from './steps/ReviewStep';

interface MultiStepCalculatorProps {
  onComplete: (data: WizardData) => void;
  onCancel?: () => void;
}

export const MultiStepCalculator: React.FC<MultiStepCalculatorProps> = ({
  onComplete,
  onCancel
}) => {
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [wizardData, setWizardData] = useState<Partial<WizardData>>({
    incomeSources: {
      investmentPortfolio: true,
      employmentIncome: false,
      selfEmploymentIncome: false,
      otherDividends: false,
      rentalIncome: false,
      savingsInterest: false,
      otherCapitalGains: false,
      pensionContributions: false
    },
    taxYear: '2024-2025',
    analysisType: 'both',
    brokerFiles: [],
    personalDetails: {
      taxResidency: 'england-wales-ni',
      dateOfBirth: '',
      claimMarriageAllowance: false,
      claimBlindPersonAllowance: false,
      carriedForwardLosses: 0,
      isRegisteredForSelfAssessment: false
    }
  });
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const updateWizardData = (updates: Partial<WizardData>) => {
    setWizardData((prev) => ({ ...prev, ...updates }));
    setValidationErrors([]);
  };

  const validateStep = (step: WizardStep): boolean => {
    const errors: string[] = [];

    switch (step) {
      case 1:
        // Step 1: Income Sources Selection
        if (!wizardData.incomeSources) {
          errors.push('Please select at least one income source');
          break;
        }
        const selectedSources = Object.values(wizardData.incomeSources).some((v) => v === true);
        if (!selectedSources) {
          errors.push('Please select at least one income source');
        }
        if (!wizardData.taxYear) {
          errors.push('Please select a tax year');
        }
        if (!wizardData.analysisType) {
          errors.push('Please select an analysis type');
        }
        break;

      case 2:
        // Step 2: File Uploads & Manual Entries
        if (wizardData.incomeSources?.investmentPortfolio) {
          if (!wizardData.brokerFiles || wizardData.brokerFiles.length === 0) {
            errors.push('Please upload at least one broker file for portfolio analysis');
          }
        }
        
        if (wizardData.incomeSources?.employmentIncome) {
          if (!wizardData.employmentIncome?.grossSalary || wizardData.employmentIncome.grossSalary <= 0) {
            errors.push('Please enter a valid gross salary for employment income');
          }
        }
        
        if (wizardData.incomeSources?.rentalIncome) {
          if (!wizardData.rentalIncome?.grossRentalIncome || wizardData.rentalIncome.grossRentalIncome <= 0) {
            errors.push('Please enter rental income details');
          }
        }
        break;

      case 3:
        // Step 3: Personal Details
        if (!wizardData.personalDetails?.taxResidency) {
          errors.push('Please select your tax residency');
        }
        if (!wizardData.personalDetails?.dateOfBirth) {
          errors.push('Please enter your date of birth');
        }
        if (wizardData.personalDetails?.carriedForwardLosses && wizardData.personalDetails.carriedForwardLosses < 0) {
          errors.push('Carried forward losses cannot be negative');
        }
        break;

      case 4:
        // Step 4: Review - no additional validation
        break;
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 4) {
        setCurrentStep((currentStep + 1) as WizardStep);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as WizardStep);
      setValidationErrors([]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = () => {
    if (validateStep(4)) {
      onComplete(wizardData as WizardData);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="step-content">
            <IncomeSourcesStep
              incomeSources={wizardData.incomeSources!}
              onChange={(sources) => updateWizardData({ incomeSources: sources })}
              taxYear={wizardData.taxYear!}
              onTaxYearChange={(year) => updateWizardData({ taxYear: year })}
              analysisType={wizardData.analysisType!}
              onAnalysisTypeChange={(type) => updateWizardData({ analysisType: type })}
            />
          </div>
        );

      case 2:
        return (
          <UploadDetailsStep
            data={wizardData as WizardData}
            onChange={updateWizardData}
          />
        );

      case 3:
        return (
          <PersonalDetailsStep
            personalDetails={wizardData.personalDetails!}
            onChange={(details) => updateWizardData({ personalDetails: details })}
          />
        );

      case 4:
        return (
          <ReviewStep
            data={wizardData as WizardData}
            onEdit={(step) => setCurrentStep(step as WizardStep)}
          />
        );
    }
  };

  return (
    <div className="multi-step-calculator">
      <div className="card shadow-sm border-0">
        <div className="card-body p-4">
          <ProgressIndicator
            currentStep={currentStep}
            totalSteps={4}
            steps={WIZARD_STEPS}
          />

          {validationErrors.length > 0 && (
            <Alert variant="danger" className="mb-4">
              <h5 className="alert-heading">
                <i className="fas fa-exclamation-triangle me-2"></i>
                Please fix the following errors:
              </h5>
              <ul className="mb-0">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </Alert>
          )}

          <div className="wizard-content">{renderStepContent()}</div>

          <div className="d-flex justify-content-between mt-4 pt-3 border-top">
            <div>
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline-secondary"
                  onClick={handlePrevious}
                  className="me-2"
                >
                  <i className="fas fa-arrow-left me-2"></i>
                  Previous
                </Button>
              )}
              {onCancel && (
                <Button
                  type="button"
                  variant="outline-danger"
                  onClick={onCancel}
                >
                  <i className="fas fa-times me-2"></i>
                  Cancel
                </Button>
              )}
            </div>

            <div>
              {currentStep < 4 ? (
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleNext}
                >
                  Next
                  <i className="fas fa-arrow-right ms-2"></i>
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="success"
                  onClick={handleSubmit}
                  size="lg"
                >
                  <i className="fas fa-calculator me-2"></i>
                  Calculate Tax
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 text-center text-muted small">
        <i className="fas fa-lock me-1"></i>
        Your data is processed securely and never stored on our servers
      </div>
    </div>
  );
};
