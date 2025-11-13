import React, { useState } from 'react';
import { useCalculation } from '../context/CalculationContext';
import { submitCalculation } from '../services/api';
import { Alert } from '../components/ui/Alert';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Select } from '../components/ui/Select';
import { AffiliateGrid } from '../components/affiliate';
import { IbkrGuide } from '../components/ui/IbkrGuide';
import { normalizeCalculationResults } from '../utils/resultsNormalizer';

type TaxYear = '2024-2025' | '2023-2024' | '2022-2023' | '2021-2022';
type AnalysisType = 'both' | 'tax' | 'portfolio';

const CalculatorPage: React.FC = () => {
  console.log('[CalculatorPage] Rendering component');
  const { state, dispatch } = useCalculation();
  
  // Form state
  const [file, setFile] = useState<File | null>(null);
  const [taxYear, setTaxYear] = useState<TaxYear>('2024-2025');
  const [analysisType, setAnalysisType] = useState<AnalysisType>('both');
  const [showIbkrGuide, setShowIbkrGuide] = useState(false);
  
  // Validation state
  const [validationErrors, setValidationErrors] = useState<{
    file?: string;
    taxYear?: string;
    analysisType?: string;
  }>({});

  // Form validation
  const validateForm = (): boolean => {
    const errors: typeof validationErrors = {};
    
    if (!file) {
      errors.file = 'Please select a file to upload';
    } else if (!file.name.match(/\.(csv|qfx)$/i)) {
      errors.file = 'Please select a valid CSV or QFX file';
    } else if (file.size > 10 * 1024 * 1024) { // 10MB limit
      errors.file = 'File size must be less than 10MB';
    }
    
    if (!taxYear) {
      errors.taxYear = 'Please select a tax year';
    }
    
    if (!analysisType) {
      errors.analysisType = 'Please select an analysis type';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    dispatch({ type: 'SUBMIT_START' });

    try {
      const formData = new FormData();
      formData.append('file', file!);
      formData.append('tax_year', taxYear);
      formData.append('analysis_type', analysisType);

      const results = await submitCalculation({
        file: file!,
        taxYear,
        analysisType
      });

      const normalized = normalizeCalculationResults(results.raw);
      dispatch({ type: 'SUBMIT_SUCCESS', payload: { raw: results.raw, normalized } });
      
      // Navigate to results
      window.location.hash = 'results';
    } catch (error: any) {
      console.error('[CalculatorPage] Submission error:', error);
      dispatch({ type: 'SUBMIT_ERROR', payload: error.message || 'An error occurred during calculation' });
    }
  };

  return (
    <div className="calculator-page">
      <div className="calculator-content">
        {/* Modern Hero Section */}
        <section className="calculator-hero">
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-lg-8 text-center">
                <div className="calculator-hero-content fade-in-up">
                  <h1 className="mb-4">
                    UK Tax Calculator
                  </h1>
                  <p className="lead mb-4">
                    Calculate your Capital Gains Tax for informational purposes. This tool follows HMRC guidelines but results are for reference only.
                  </p>
                  <div className="disclaimer-banner">
                    <div className="alert alert-warning border-0 mb-4">
                      <i className="bi bi-exclamation-triangle-fill me-2"></i>
                      <strong>Important:</strong> This calculator is for informational purposes only. 
                      You are solely responsible for verifying calculations and submitting accurate information to HMRC. 
                      Use at your own risk.
                    </div>
                  </div>
                  <div className="trust-indicators">
                    <div className="trust-indicator">
                      <i className="bi bi-info-circle trust-icon"></i>
                      <span>Educational Tool</span>
                    </div>
                    <div className="trust-indicator">
                      <i className="bi bi-lock-fill trust-icon"></i>
                      <span>Private & Secure</span>
                    </div>
                    <div className="trust-indicator">
                      <i className="bi bi-code-slash trust-icon"></i>
                      <span>Open Source</span>
                    </div>
                    <div className="trust-indicator">
                      <i className="bi bi-clock-fill trust-icon"></i>
                      <span>Instant Results</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Input Requirements Section */}
        <section className="input-requirements-section py-4 mb-4 bg-light">
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-lg-10">
                <div className="bg-white p-4 rounded shadow-sm">
                  <h3 className="h5 mb-3 text-primary">
                    <i className="fas fa-info-circle me-2"></i>
                    Input File Requirements
                  </h3>
                  <p className="mb-3 small text-muted">
                    The calculator supports QFX files from Interactive Brokers and CSV files from multiple brokers.
                    Your file should contain all buy/sell transactions for accurate tax calculations.
                  </p>

                  <div className="row g-3">
                    <div className="col-md-6">
                      <div className="border-start border-primary border-4 ps-3">
                        <h6 className="fw-bold text-primary mb-2">
                          <i className="fas fa-file-code me-1"></i>
                          QFX Format (Interactive Brokers)
                        </h6>
                        <ul className="small mb-2">
                          <li>Export from IBKR Client Portal → Reports → Third-Party Downloads → Quicken</li>
                          <li>Includes currency conversions and fees automatically</li>
                          <li>Handles stock splits and corporate actions</li>
                          <li>Best for comprehensive IBKR accounts</li>
                        </ul>
                        <button
                          className="btn btn-link btn-sm p-0 text-decoration-none"
                          onClick={() => window.location.hash = 'guide'}
                        >
                          Detailed IBKR Export Guide →
                        </button>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="border-start border-success border-4 ps-3">
                        <h6 className="fw-bold text-success mb-2">
                          <i className="fas fa-file-csv me-1"></i>
                          CSV Format (Multiple Brokers)
                        </h6>
                        <ul className="small mb-2">
                          <li>Works with Sharesight, Hargreaves Lansdown, Fidelity, etc.</li>
                          <li>Requires specific column format (see guide below)</li>
                          <li>Manual currency conversion may be needed</li>
                          <li>Good for non-IBKR brokers or custom data</li>
                        </ul>
                        <button
                          className="btn btn-link btn-sm p-0 text-decoration-none"
                          onClick={() => window.location.hash = 'guide'}
                        >
                          CSV Format Specification →
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="alert alert-warning border-0 mt-3 mb-0">
                    <small>
                      <strong>Important:</strong> For accurate results, export data covering complete tax years.
                      Include all transactions (buys, sells, dividends, fees) from your chosen period.
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8 col-xl-7">
              {/* Main Calculation Form */}
              <div className="calculator-form-card p-4 p-md-5 mb-5">
                <div className="text-center mb-4">
                  <h2 className="h4 mb-2">Upload Your Portfolio Data</h2>
                  <p className="text-muted">Get started by uploading your transaction file</p>
                </div>

                <form onSubmit={handleSubmit}>
                  {/* Modern File Upload Section */}
                  <div className="modern-form-field">
                    <label className="modern-form-label">
                      <span className="emoji">📁</span>
                      Upload Your Portfolio File *
                    </label>
                    {validationErrors.file && (
                      <div className="alert alert-danger py-2 px-3 mb-3">
                        <small>{validationErrors.file}</small>
                      </div>
                    )}
                    
                    <div className="modern-file-upload" onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = '.csv,.qfx,.ofx';
                      input.onchange = (e) => {
                        const target = e.target as HTMLInputElement;
                        if (target.files?.[0]) {
                          setFile(target.files[0]);
                        }
                      };
                      input.click();
                    }}>
                      <div className="file-upload-icon">
                        <i className="bi bi-cloud-upload"></i>
                      </div>
                      <div className="file-upload-text">
                        {file ? 'Change File' : 'Choose File to Upload'}
                      </div>
                      <div className="file-upload-subtext">
                        CSV or QFX files from IBKR, HL, Sharesight, etc. (Max 10MB)
                      </div>
                      <button
                        className="btn btn-link btn-sm mt-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowIbkrGuide(!showIbkrGuide);
                        }}
                      >
                        How to get my QFX file from IBKR?
                      </button>
                    </div>
                    
                    {showIbkrGuide && <IbkrGuide />}

                    {file && (
                      <div className="selected-file-display">
                        <div className="file-icon">
                          <i className="bi bi-file-earmark-text"></i>
                        </div>
                        <div className="flex-grow-1">
                          <div className="fw-semibold">{file.name}</div>
                          <div className="text-muted small">
                            {(file.size / 1024).toFixed(1)} KB • {file.type || 'Unknown type'}
                          </div>
                        </div>
                        <div className="text-success">
                          <i className="bi bi-check-circle-fill"></i>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="row">
                    {/* Tax Year Selection */}
                    <div className="col-md-6">
                      <div className="modern-form-field">
                        <label className="modern-form-label">
                          <span className="emoji">📅</span>
                          Tax Year *
                        </label>
                        {validationErrors.taxYear && (
                          <div className="alert alert-danger py-2 px-3 mb-2">
                            <small>{validationErrors.taxYear}</small>
                          </div>
                        )}
                        <Select
                          value={taxYear}
                          onChange={(e) => setTaxYear(e.target.value as TaxYear)}
                          disabled={state.status === 'submitting'}
                          className="modern-select"
                          options={[
                            { value: '2024-2025', label: '2024-2025' },
                            { value: '2023-2024', label: '2023-2024' },
                            { value: '2022-2023', label: '2022-2023' },
                            { value: '2021-2022', label: '2021-2022' }
                          ]}
                        />
                      </div>
                    </div>

                    {/* Analysis Type Selection */}
                    <div className="col-md-6">
                      <div className="modern-form-field">
                        <label className="modern-form-label">
                          <span className="emoji">📊</span>
                          Analysis Type *
                        </label>
                        {validationErrors.analysisType && (
                          <div className="alert alert-danger py-2 px-3 mb-2">
                            <small>{validationErrors.analysisType}</small>
                          </div>
                        )}
                        <Select
                          value={analysisType}
                          onChange={(e) => setAnalysisType(e.target.value as AnalysisType)}
                          disabled={state.status === 'submitting'}
                          className="modern-select"
                          options={[
                            { value: 'both', label: 'Tax & Portfolio Analysis' },
                            { value: 'tax', label: 'Tax Analysis Only' },
                            { value: 'portfolio', label: 'Portfolio Analysis Only' }
                          ]}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Professional Submit Button */}
                  <div className="text-center mt-4">
                    <button
                      type="submit"
                      className="calculator-submit-btn w-100"
                      disabled={state.status === 'submitting' || !file}
                    >
                      {state.status === 'submitting' ? (
                        <>
                          <i className="bi bi-arrow-repeat me-2 pulse"></i>
                          Calculating Your Tax...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-calculator me-2"></i>
                          Calculate My Tax & Portfolio
                        </>
                      )}
                    </button>
                    
                    <div className="mt-3">
                      <small className="text-muted">
                        <i className="bi bi-shield-check me-1"></i>
                        Files processed securely & deleted immediately - no data retained
                      </small>
                      <br />
                      <small className="text-warning">
                        <i className="bi bi-exclamation-triangle me-1"></i>
                        For educational purposes only - verify all results independently
                      </small>
                    </div>
                  </div>
                </form>

                {/* Status Messages */}
                {state.error && (
                  <Alert variant="danger" className="mt-4">
                    <strong>Error:</strong> {state.error}
                  </Alert>
                )}
                
                {state.status === 'submitting' && !state.error && (
                  <div className="text-center mt-4">
                    <LoadingSpinner size="lg" />
                    <p className="mt-2 text-muted">Analyzing your portfolio...</p>
                  </div>
                )}

                {state.result && (
                  <Alert variant="success" className="mt-4">
                    <strong>Success!</strong> Calculation completed. 
                    <a href="#results" className="alert-link ms-2">View Results →</a>
                  </Alert>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Professional Features Section */}
        <section className="features-section">
          <div className="container">
            <div className="row justify-content-center mb-5">
              <div className="col-lg-8 text-center">
                <h2 className="h3 mb-3">Calculator Features</h2>
                <p className="text-muted">
                  Free educational tool to help you understand UK tax calculations
                </p>
              </div>
            </div>
            
            <div className="row g-4 mb-5">
              <div className="col-md-6 col-lg-3">
                <div className="feature-card text-center">
                  <div className="feature-icon mx-auto">
                    <i className="bi bi-shield-check"></i>
                  </div>
                  <h3 className="feature-title">HMRC Guidelines</h3>
                  <p className="feature-description">
                    Follows HMRC guidelines for educational purposes. Always verify calculations independently
                  </p>
                </div>
              </div>
              
              <div className="col-md-6 col-lg-3">
                <div className="feature-card text-center">
                  <div className="feature-icon mx-auto">
                    <i className="bi bi-lightning-charge"></i>
                  </div>
                  <h3 className="feature-title">Instant Results</h3>
                  <p className="feature-description">
                    Get detailed tax calculations and portfolio analysis in seconds, not hours
                  </p>
                </div>
              </div>
              
              <div className="col-md-6 col-lg-3">
                <div className="feature-card text-center">
                  <div className="feature-icon mx-auto">
                    <i className="bi bi-lock-fill"></i>
                  </div>
                  <h3 className="feature-title">Data Privacy</h3>
                  <p className="feature-description">
                    Files processed securely on AWS and immediately deleted. No personal data is stored or retained
                  </p>
                </div>
              </div>
              
              <div className="col-md-6 col-lg-3">
                <div className="feature-card text-center">
                  <div className="feature-icon mx-auto">
                    <i className="bi bi-file-earmark-text"></i>
                  </div>
                  <h3 className="feature-title">Multiple Formats</h3>
                  <p className="feature-description">
                    Support for IBKR QFX files, Sharesight CSV, and other major broker formats
                  </p>
                </div>
              </div>
            </div>

            {/* Important Disclaimers */}
            <div className="row justify-content-center">
              <div className="col-lg-10">
                <div className="disclaimer-section">
                  <div className="alert alert-info border-0 p-4">
                    <h4 className="alert-heading mb-3">
                      <i className="bi bi-info-circle me-2"></i>
                      Important Disclaimers
                    </h4>
                    <div className="row g-4">
                      <div className="col-md-6">
                        <div className="d-flex">
                          <div className="flex-shrink-0 me-3">
                            <i className="bi bi-exclamation-triangle text-warning"></i>
                          </div>
                          <div>
                            <strong>Use at Your Own Risk:</strong> This calculator is provided for educational purposes only. 
                            You are solely responsible for verifying all calculations and ensuring accuracy before submitting to HMRC.
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="d-flex">
                          <div className="flex-shrink-0 me-3">
                            <i className="bi bi-person-check text-primary"></i>
                          </div>
                          <div>
                            <strong>Professional Advice:</strong> Always consult with a qualified tax advisor or accountant 
                            for official tax advice and complex situations.
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="d-flex">
                          <div className="flex-shrink-0 me-3">
                            <i className="bi bi-currency-pound text-success"></i>
                          </div>
                          <div>
                            <strong>Free to Use:</strong> This tool is completely free. We earn from affiliate 
                            links to tax-related books and resources to keep this service running.
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="d-flex">
                          <div className="flex-shrink-0 me-3">
                            <i className="bi bi-shield-check text-info"></i>
                          </div>
                          <div>
                            <strong>Data Privacy:</strong> Files are processed securely on AWS and immediately deleted. 
                            No personal or financial data is stored or retained on our servers.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Tax Education Resources Section */}
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-10">
              <div className="mt-5">
                <div className="text-center mb-4">
                  <h2 className="h3 text-dark mb-2">
                    📚 Recommended Tax Resources
                  </h2>
                  <p className="text-muted">
                    Enhance your tax knowledge with these expert-recommended guides
                  </p>
                </div>
                
                <AffiliateGrid
                  category="tax"
                  limit={3}
                  columns={{ xs: 1, sm: 3, md: 3, lg: 3, xl: 3 }}
                  showRatings={true}
                  showCategories={false}
                  layout="vertical"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalculatorPage;
