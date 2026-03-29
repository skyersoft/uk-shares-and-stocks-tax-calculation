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
        <div className="mb-3">
          <div className="d-flex align-items-center mb-2">
            <i className="fas fa-file-upload text-primary me-2" style={{ fontSize: '1.25rem' }}></i>
            <div>
              <h6 className="mb-0">Upload Investment Files</h6>
              <p className="text-muted mb-0 small">
                Upload transaction files from your broker(s).
              </p>
            </div>
          </div>

          <MultiFileUpload
            files={data.brokerFiles}
            onChange={(files) => onChange({ ...data, brokerFiles: files })}
            maxFiles={10}
          />

          <div className="alert alert-info py-2 mt-2 small" role="alert">
            <i className="fas fa-info-circle me-1"></i>
            <strong>Tip:</strong> Upload files from multiple brokers and label each account for clarity.
          </div>
        </div>
      )}

      {/* Employment Income Section */}
      {hasEmployment && (
        <div className="mb-3">
          <EmploymentIncome
            data={employmentData}
            onChange={(employmentIncome) => onChange({ ...data, employmentIncome })}
          />
        </div>
      )}

      {/* Rental Income Section */}
      {hasRental && (
        <div className="mb-3">
          <RentalIncome
            data={rentalData}
            onChange={(rentalIncome) => onChange({ ...data, rentalIncome })}
          />
        </div>
      )}

      {/* Savings Interest Section */}
      {hasSavings && (
        <div className="mb-3">
          <SavingsInterest
            data={savingsData}
            onChange={(savingsInterest) => onChange({ ...data, savingsInterest })}
          />
        </div>
      )}

      {/* Other Dividends Section */}
      {hasOtherDividends && (
        <div className="mb-3">
          <OtherDividends
            data={otherDividendsData}
            onChange={(otherDividends) => onChange({ ...data, otherDividends })}
          />
        </div>
      )}

      {/* Other Capital Gains Section */}
      {hasOtherGains && (
        <div className="mb-3">
          <OtherCapitalGains
            data={otherGainsData}
            onChange={(otherCapitalGains) => onChange({ ...data, otherCapitalGains })}
          />
        </div>
      )}

      {/* Help Section */}
      <div className="card border-0 mt-3 shadow-sm">
        <div className="card-body">
          <h5 className="card-title mb-3">
            <i className="fas fa-book me-2 text-primary"></i>
            Supported File Formats &amp; Export Guides
          </h5>
          <p className="text-muted mb-4">
            Click on your broker below to see detailed instructions on how to export and format your files.
          </p>

          <div className="accordion" id="brokerHelpAccordion">
            {/* Trading 212 */}
            <div className="accordion-item">
              <h2 className="accordion-header">
                <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#trading212Help">
                  <strong>Trading 212</strong>&nbsp;- Full Support with Exchange Rates
                </button>
              </h2>
              <div id="trading212Help" className="accordion-collapse collapse" data-bs-parent="#brokerHelpAccordion">
                <div className="accordion-body">
                  <div className="alert alert-success py-2 mb-3">
                    <small><strong>✅ Exchange Rates:</strong> Trading 212 CSVs include exchange rates - no manual conversion needed!</small>
                  </div>
                  <h6>Required Columns:</h6>
                  <ul className="small mb-2">
                    <li><code>Action</code> - Transaction type (Buy, Sell, Dividend)</li>
                    <li><code>Time</code> - Date and time (YYYY-MM-DD HH:MM:SS)</li>
                    <li><code>Ticker</code> - Stock symbol</li>
                    <li><code>No. of shares</code> - Quantity</li>
                    <li><code>Price / share</code> - Price per share</li>
                    <li><code>Currency (Price / share)</code> - Transaction currency</li>
                    <li><code>Exchange rate</code> - FX rate to GBP</li>
                  </ul>
                  <h6>How to Export:</h6>
                  <ol className="small mb-0">
                    <li>Log into Trading 212</li>
                    <li>Go to <strong>History → Export</strong></li>
                    <li>Select date range and download CSV</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Interactive Brokers */}
            <div className="accordion-item">
              <h2 className="accordion-header">
                <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#ibkrHelp">
                  <strong>Interactive Brokers (IBKR)</strong>&nbsp;- QFX or CSV Format
                </button>
              </h2>
              <div id="ibkrHelp" className="accordion-collapse collapse" data-bs-parent="#brokerHelpAccordion">
                <div className="accordion-body">
                  <div className="alert alert-info py-2 mb-3">
                    <small><strong>ℹ️ Recommended:</strong> Use QFX format for best compatibility. CSV Flex Queries also supported.</small>
                  </div>
                  <h6>How to Export QFX:</h6>
                  <ol className="small mb-3">
                    <li>Log into IBKR Client Portal</li>
                    <li>Go to <strong>Performance &amp; Reports → Statements</strong></li>
                    <li>Select Activity Statement</li>
                    <li>Choose date range and format: <strong>QFX</strong></li>
                    <li>Download and upload</li>
                  </ol>
                  <h6>CSV Required Columns (Flex Query):</h6>
                  <ul className="small mb-0">
                    <li><code>Symbol</code>, <code>TradeDate</code>, <code>Buy/Sell</code>, <code>Quantity</code>, <code>TradePrice</code>, <code>CurrencyPrimary</code></li>
                    <li>Optional: <code>IBCommission</code>, <code>FXRateToBase</code></li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Freetrade */}
            <div className="accordion-item">
              <h2 className="accordion-header">
                <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#freetradeHelp">
                  <strong>Freetrade</strong>&nbsp;- CSV Export
                </button>
              </h2>
              <div id="freetradeHelp" className="accordion-collapse collapse" data-bs-parent="#brokerHelpAccordion">
                <div className="accordion-body">
                  <div className="alert alert-warning py-2 mb-3">
                    <small><strong>⚠️ No Exchange Rates:</strong> Freetrade CSVs don't include FX rates. Foreign currency values must be manually converted to GBP.</small>
                  </div>
                  <h6>Required Columns:</h6>
                  <ul className="small mb-2">
                    <li><code>Date</code>, <code>Type</code>, <code>Ticker</code>, <code>Quantity</code>, <code>Price</code>, <code>Total</code>, <code>Currency</code></li>
                  </ul>
                  <h6>How to Export:</h6>
                  <ol className="small mb-0">
                    <li>Open Freetrade app</li>
                    <li>Go to <strong>Account → Statements</strong></li>
                    <li>Request transaction history export</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Fidelity */}
            <div className="accordion-item">
              <h2 className="accordion-header">
                <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#fidelityHelp">
                  <strong>Fidelity UK</strong>&nbsp;- CSV Export
                </button>
              </h2>
              <div id="fidelityHelp" className="accordion-collapse collapse" data-bs-parent="#brokerHelpAccordion">
                <div className="accordion-body">
                  <div className="alert alert-warning py-2 mb-3">
                    <small><strong>⚠️ No Exchange Rates:</strong> Manual FX conversion may be required for non-GBP transactions.</small>
                  </div>
                  <h6>Required Columns:</h6>
                  <ul className="small mb-2">
                    <li><code>Trade Date</code>, <code>Action</code>, <code>Symbol</code>, <code>Quantity</code>, <code>Price</code>, <code>Amount</code>, <code>Settlement Currency</code></li>
                  </ul>
                  <h6>Action Values:</h6>
                  <p className="small mb-0">YOU BOUGHT, YOU SOLD, DIVIDEND</p>
                </div>
              </div>
            </div>

            {/* Hargreaves Lansdown */}
            <div className="accordion-item">
              <h2 className="accordion-header">
                <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#hlHelp">
                  <strong>Hargreaves Lansdown</strong>&nbsp;- CSV Export
                </button>
              </h2>
              <div id="hlHelp" className="accordion-collapse collapse" data-bs-parent="#brokerHelpAccordion">
                <div className="accordion-body">
                  <div className="alert alert-info py-2 mb-3">
                    <small><strong>ℹ️ GBP Only:</strong> HL converts all foreign transactions to GBP. All values are treated as GBP.</small>
                  </div>
                  <h6>Required Columns:</h6>
                  <ul className="small mb-2">
                    <li><code>Date</code>, <code>Transaction Type</code>, <code>Security</code>, <code>ISIN</code>, <code>Quantity</code>, <code>Price</code>, <code>Value</code></li>
                  </ul>
                  <h6>Special Handling:</h6>
                  <ul className="small mb-0">
                    <li>Automatically detects if prices are in pence and converts to pounds</li>
                    <li>ISA and SIPP accounts are flagged for tax-exempt treatment</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Generic CSV */}
            <div className="accordion-item">
              <h2 className="accordion-header">
                <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#genericHelp">
                  <strong>Generic CSV</strong>&nbsp;- Any Broker
                </button>
              </h2>
              <div id="genericHelp" className="accordion-collapse collapse" data-bs-parent="#brokerHelpAccordion">
                <div className="accordion-body">
                  <p className="small">If your broker isn't listed, create a CSV with these columns:</p>
                  <h6>Required Columns:</h6>
                  <ul className="small mb-2">
                    <li><code>Date</code> - YYYY-MM-DD or DD/MM/YYYY</li>
                    <li><code>Type</code> - BUY, SELL, DIVIDEND, SPLIT</li>
                    <li><code>Symbol</code> - Stock ticker</li>
                    <li><code>Quantity</code> - Number of shares</li>
                    <li><code>Price</code> - Price per share</li>
                  </ul>
                  <h6>Optional Columns:</h6>
                  <ul className="small mb-0">
                    <li><code>Fees</code>, <code>Currency</code> (default: GBP), <code>Name</code></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Common Errors Section */}
          <div className="mt-4 p-3 bg-light rounded">
            <h6><i className="fas fa-exclamation-triangle text-warning me-2"></i>Common Issues</h6>
            <ul className="small mb-0">
              <li><strong>Missing columns error:</strong> Ensure your CSV has all required columns for your broker</li>
              <li><strong>Date format issues:</strong> Use YYYY-MM-DD or DD/MM/YYYY format</li>
              <li><strong>Currency conversion:</strong> For brokers without FX rates, convert foreign amounts to GBP before uploading</li>
              <li><strong>File encoding:</strong> Save as UTF-8 if you encounter character issues</li>
            </ul>
            <p className="small text-muted mt-2 mb-0">
              <a href="#help" className="text-primary">View full documentation</a> for detailed examples and sample CSV content.
            </p>
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
