import React from 'react';
import { 
  WizardData,
  EmploymentIncomeData,
  RentalIncomeData,
  SavingsInterestData,
  OtherDividendsData,
  OtherCapitalGainsData
} from '../../../types/calculator';
import { MultiFileUpload } from '../MultiFileUpload';
import { EmploymentIncome } from '../income/EmploymentIncome';
import { RentalIncome } from '../income/RentalIncome';
import { SavingsInterest } from '../income/SavingsInterest';
import { OtherDividends } from '../income/OtherDividends';
import { OtherCapitalGains } from '../income/OtherCapitalGains';

interface UploadDetailsStepProps {
  data: WizardData;
  onChange: (data: WizardData) => void;
}

export const UploadDetailsStep: React.FC<UploadDetailsStepProps> = ({ data, onChange }) => {
  const { incomeSources } = data;

  const hasInvestments = incomeSources.investmentPortfolio;
  const hasEmployment = incomeSources.employmentIncome;
  const hasRental = incomeSources.rentalIncome;
  const hasSavings = incomeSources.savingsInterest;
  const hasOtherDividends = incomeSources.otherDividends;
  const hasOtherGains = incomeSources.otherCapitalGains;

  // Default data objects
  const employmentData: EmploymentIncomeData = data.employmentIncome || {
    grossSalary: 0,
    bonuses: 0,
    benefitsInKind: 0,
    payeTaxPaid: 0,
    niPaid: 0,
    studentLoanDeductions: 0,
    employeePensionContributions: 0,
    employerPensionContributions: 0
  };

  const rentalData: RentalIncomeData = data.rentalIncome || {
    grossRentalIncome: 0,
    mortgageInterest: 0,
    repairsCosts: 0,
    agentFees: 0,
    otherExpenses: 0,
    usePropertyAllowance: false
  };

  const savingsData: SavingsInterestData = data.savingsInterest || {
    totalInterest: 0
  };

  const otherDividendsData: OtherDividendsData = data.otherDividends || {
    ukDividends: 0,
    foreignDividends: 0
  };

  const otherGainsData: OtherCapitalGainsData = data.otherCapitalGains || {
    propertyGains: [],
    cryptoGains: [],
    otherGains: []
  };

  return (
    <div className="upload-details-step">
      {/* Investment Files Upload Section */}
      {hasInvestments && (
        <div className="mb-5">
          <div className="d-flex align-items-center mb-3">
            <i className="fas fa-file-upload text-primary me-3" style={{ fontSize: '2rem' }}></i>
            <div>
              <h4 className="mb-1">Upload Investment Files</h4>
              <p className="text-muted mb-0">
                Upload transaction files from your broker(s). Supported formats vary by broker.
              </p>
            </div>
          </div>
          
          <MultiFileUpload
            files={data.brokerFiles}
            onChange={(files) => onChange({ ...data, brokerFiles: files })}
            maxFiles={10}
          />

          <div className="alert alert-info mt-3" role="alert">
            <i className="fas fa-info-circle me-2"></i>
            <strong>Tip:</strong> You can upload files from multiple brokers. Each file will be processed separately,
            and you can label each account for clarity in your records.
          </div>
        </div>
      )}

      {/* Employment Income Section */}
      {hasEmployment && (
        <div className="mb-5">
          <EmploymentIncome
            data={employmentData}
            onChange={(employmentIncome) => onChange({ ...data, employmentIncome })}
          />
        </div>
      )}

      {/* Rental Income Section */}
      {hasRental && (
        <div className="mb-5">
          <RentalIncome
            data={rentalData}
            onChange={(rentalIncome) => onChange({ ...data, rentalIncome })}
          />
        </div>
      )}

      {/* Savings Interest Section */}
      {hasSavings && (
        <div className="mb-5">
          <SavingsInterest
            data={savingsData}
            onChange={(savingsInterest) => onChange({ ...data, savingsInterest })}
          />
        </div>
      )}

      {/* Other Dividends Section */}
      {hasOtherDividends && (
        <div className="mb-5">
          <OtherDividends
            data={otherDividendsData}
            onChange={(otherDividends) => onChange({ ...data, otherDividends })}
          />
        </div>
      )}

      {/* Other Capital Gains Section */}
      {hasOtherGains && (
        <div className="mb-5">
          <OtherCapitalGains
            data={otherGainsData}
            onChange={(otherCapitalGains) => onChange({ ...data, otherCapitalGains })}
          />
        </div>
      )}

      {/* Help Section */}
      <div className="card bg-light border-0 mt-5">
        <div className="card-body">
          <h5 className="card-title">
            <i className="fas fa-question-circle me-2"></i>
            Need Help?
          </h5>
          <div className="row">
            <div className="col-md-6">
              <h6 className="text-muted mb-2">File Formats</h6>
              <ul className="small mb-3">
                <li><strong>Interactive Brokers:</strong> Activity Statement (CSV/XML)</li>
                <li><strong>Hargreaves Lansdown:</strong> Contract Notes (CSV)</li>
                <li><strong>Trading 212:</strong> History export (CSV)</li>
                <li><strong>Others:</strong> Transaction history (CSV)</li>
              </ul>
            </div>
            <div className="col-md-6">
              <h6 className="text-muted mb-2">What to Include</h6>
              <ul className="small mb-0">
                <li>All trades within the tax year</li>
                <li>Dividend payments received</li>
                <li>Interest earned (if applicable)</li>
                <li>Corporate actions (splits, mergers)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="alert alert-success mt-4 mb-0" role="alert">
        <i className="fas fa-check-circle me-2"></i>
        <strong>Ready to Continue:</strong> Once you've filled in all relevant sections, click "Next" to review your information.
      </div>
    </div>
  );
};
