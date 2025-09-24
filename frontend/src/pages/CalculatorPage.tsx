import React, { useState } from 'react';
import { useCalculation } from '../context/CalculationContext';
import { submitCalculation } from '../services/api';
import { FileUpload } from '../components/ui/FileUpload';
import { Alert } from '../components/ui/Alert';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Button } from '../components/ui/Button';
import { FormField } from '../components/ui/FormField';
import { Select } from '../components/ui/Select';
import { Card } from '../components/ui/Card';
import { Accordion } from '../components/ui/Accordion';
import { useToast } from '../components/ui/ToastContext';
import { AffiliateGrid } from '../components/affiliate';

type TaxYear = '2024-2025' | '2023-2024' | '2022-2023' | '2021-2022';
type AnalysisType = 'both' | 'tax' | 'portfolio';

const CalculatorPage: React.FC = () => {
  console.log('[CalculatorPage] Rendering component');
  const { state, dispatch } = useCalculation();
  // const { addToast } = useToast(); // Temporarily disabled for testing
  
  // Form state
  const [file, setFile] = useState<File | null>(null);
  const [taxYear, setTaxYear] = useState<TaxYear>('2024-2025');
  const [analysisType, setAnalysisType] = useState<AnalysisType>('both');
  
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      // addToast(
      //   'Please fix the errors below and try again.',
      //   'danger',
      //   { title: 'Validation Error', autoHide: 5000 }
      // );
      return;
    }
    
    dispatch({ type: 'SUBMIT_START' });
    
    try {
      const { raw } = await submitCalculation({ file: file!, taxYear, analysisType });
      // Normalization placeholder: just pass through raw for now
      const normalized = raw;
      dispatch({ type: 'SUBMIT_SUCCESS', payload: { raw, normalized } });
      
      // Show success notification
      // addToast(
      //   'Your tax calculation has been completed successfully.',
      //   'success',
      //   { title: 'Calculation Complete', autoHide: 5000 }
      // );
      
      // Redirect to results
      window.location.hash = '#results';
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during calculation';
      dispatch({ type: 'SUBMIT_ERROR', payload: errorMessage });
      
      // Show error notification
      // addToast(
      //   errorMessage,
      //   'danger',
      //   { title: 'Calculation Failed', autoHide: 7000 }
      // );
    }
  };

  console.log('[CalculatorPage] State:', state, 'File:', file);

  return (
    <div className="container-fluid py-4">
      <div className="row justify-content-center">
        <div className="col-lg-8 col-xl-6">
          {/* Page Header */}
          <div className="text-center mb-5">
            <h1 className="display-5 fw-bold text-primary mb-3">
              🧮 UK Tax Calculator
            </h1>
            <p className="lead text-muted">
              Calculate your UK Capital Gains Tax and analyze your portfolio with professional accuracy
            </p>
          </div>

          {/* Main Calculation Form */}
          <div className="card shadow-sm">
            <div className="card-body p-4">
              <form onSubmit={handleSubmit}>
                {/* File Upload Section */}
                <FormField
                  label="📁 Upload Your Portfolio File"
                  error={validationErrors.file}
                  helpText="Select a CSV or QFX file from your broker (IBKR, HL, etc.)"
                  required
                >
                  <FileUpload
                    onFileSelect={setFile}
                    accept=".csv,.qfx,.ofx"
                    maxSize={10 * 1024 * 1024} // 10MB
                    className="mb-3"
                    disabled={state.status === 'submitting'}
                  />
                  {file && (
                    <div className="alert alert-info py-2 px-3 mt-2">
                      <small>
                        <strong>Selected:</strong> {file.name} ({(file.size / 1024).toFixed(1)} KB)
                      </small>
                    </div>
                  )}
                </FormField>

                <div className="row">
                  {/* Tax Year Selection */}
                  <div className="col-md-6 mb-3">
                    <FormField
                      label="📅 Tax Year"
                      error={validationErrors.taxYear}
                      required
                    >
                      <Select
                        value={taxYear}
                        onChange={(e) => setTaxYear(e.target.value as TaxYear)}
                        disabled={state.status === 'submitting'}
                        options={[
                          { value: '2024-2025', label: '2024-2025' },
                          { value: '2023-2024', label: '2023-2024' },
                          { value: '2022-2023', label: '2022-2023' },
                          { value: '2021-2022', label: '2021-2022' }
                        ]}
                      />
                    </FormField>
                  </div>

                  {/* Analysis Type Selection */}
                  <div className="col-md-6 mb-3">
                    <FormField
                      label="📊 Analysis Type"
                      error={validationErrors.analysisType}
                      required
                    >
                      <Select
                        value={analysisType}
                        onChange={(e) => setAnalysisType(e.target.value as AnalysisType)}
                        disabled={state.status === 'submitting'}
                        options={[
                          { value: 'both', label: 'Tax & Portfolio Analysis' },
                          { value: 'tax', label: 'Tax Analysis Only' },
                          { value: 'portfolio', label: 'Portfolio Analysis Only' }
                        ]}
                      />
                    </FormField>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="d-grid gap-2 mt-4">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    disabled={state.status === 'submitting' || !file}
                    loading={state.status === 'submitting'}
                  >
                    {state.status === 'submitting' ? 'Calculating...' : '🚀 Calculate Tax & Portfolio'}
                  </Button>
                </div>
              </form>
            </div>
          </div>

          {/* Error Display */}
          {state.error && (
            <div className="mt-4">
              <Alert
                variant="danger"
                title="Calculation Error"
                dismissible
                onDismiss={() => dispatch({ type: 'SUBMIT_ERROR', payload: null })}
              >
                {state.error}
              </Alert>
            </div>
          )}

          {/* Loading State */}
          {state.status === 'submitting' && (
            <div className="mt-4 text-center">
              <LoadingSpinner
                size="lg"
                text="Processing your portfolio data..."
                centered
              />
              <p className="text-muted mt-3">
                <small>This may take a few moments for large files</small>
              </p>
            </div>
          )}

          {/* Success State */}
          {state.status === 'success' && (
            <div className="mt-4">
              <Alert
                variant="success"
                title="Calculation Complete!"
              >
                Your tax calculation has been completed successfully.
                <div className="mt-3">
                  <Button
                    variant="success"
                    onClick={() => window.location.hash = '#results'}
                  >
                    📊 View Results
                  </Button>
                </div>
              </Alert>
            </div>
          )}

        </div>
      </div>

      {/* Feature Highlights Section */}
      <div className="row mt-5 mb-5">
        <div className="col-12">
          <div className="text-center mb-4">
            <h2 className="display-6 fw-bold text-primary">Why Choose Our Tax Calculator?</h2>
            <p className="lead text-muted">Professional-grade UK tax calculations designed for modern investors</p>
          </div>
          
          <div className="row g-4">
            <div className="col-md-4">
              <Card 
                variant="light" 
                className="h-100 text-center border-0 shadow-sm"
              >
                <div className="card-body p-4">
                  <div className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
                       style={{ width: '60px', height: '60px' }}>
                    <i className="fas fa-calculator fa-lg"></i>
                  </div>
                  <h5 className="card-title fw-bold">HMRC Compliant</h5>
                  <p className="card-text text-muted">
                    Accurate UK tax calculations following HMRC guidelines for capital gains, 
                    dividends, and currency conversions with Section 104 pooling.
                  </p>
                </div>
              </Card>
            </div>
            
            <div className="col-md-4">
              <Card 
                variant="light" 
                className="h-100 text-center border-0 shadow-sm"
              >
                <div className="card-body p-4">
                  <div className="bg-success text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
                       style={{ width: '60px', height: '60px' }}>
                    <i className="fas fa-chart-line fa-lg"></i>
                  </div>
                  <h5 className="card-title fw-bold">Portfolio Analytics</h5>
                  <p className="card-text text-muted">
                    Comprehensive portfolio analysis with performance metrics, 
                    market breakdown, and detailed holdings overview.
                  </p>
                </div>
              </Card>
            </div>
            
            <div className="col-md-4">
              <Card 
                variant="light" 
                className="h-100 text-center border-0 shadow-sm"
              >
                <div className="card-body p-4">
                  <div className="bg-info text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
                       style={{ width: '60px', height: '60px' }}>
                    <i className="fas fa-shield-alt fa-lg"></i>
                  </div>
                  <h5 className="card-title fw-bold">Secure & Private</h5>
                  <p className="card-text text-muted">
                    Enterprise-grade security with no data storage. Your financial 
                    information is processed securely and never retained.
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="row mt-5 mb-5">
        <div className="col-lg-10 mx-auto">
          <div className="text-center mb-4">
            <h2 className="display-6 fw-bold text-primary">Frequently Asked Questions</h2>
            <p className="lead text-muted">Everything you need to know about using our tax calculator</p>
          </div>
          
          <Accordion
            items={[
              {
                id: 'file-formats',
                header: 'What file formats does the calculator accept?',
                content: (
                  <div>
                    <p>The calculator accepts both QFX (Quicken Financial Exchange) and CSV (Comma Separated Values) files exported from brokers like Interactive Brokers, Hargreaves Lansdown, and others.</p>
                    <p><strong>To export from IBKR:</strong></p>
                    <ol>
                      <li>Log into your IBKR Client Portal</li>
                      <li>Go to Reports → Flex Queries or Activity Statements</li>
                      <li>Select the appropriate date range for your tax year</li>
                      <li>Choose QFX format for best results</li>
                    </ol>
                  </div>
                )
              },
              {
                id: 'accuracy',
                header: 'How accurate are the tax calculations?',
                content: (
                  <div>
                    <p>Our calculator uses HMRC-compliant methodologies including Section 104 pooling for share calculations and official exchange rates for currency conversions.</p>
                    <p><strong>Key features ensuring accuracy:</strong></p>
                    <ul>
                      <li>Section 104 pooling for same-class shares</li>
                      <li>Historical exchange rates from HMRC data</li>
                      <li>Proper handling of dividend withholding taxes</li>
                      <li>Current tax rates and allowances for each tax year</li>
                    </ul>
                    <p><em>Note: Complex situations involving options, futures, or corporate actions may require professional review.</em></p>
                  </div>
                )
              },
              {
                id: 'privacy',
                header: 'What about data privacy and security?',
                content: (
                  <div>
                    <p>Your financial data is processed securely and never stored permanently. All calculations are performed server-side with enterprise-grade security measures.</p>
                    <p><strong>Security measures:</strong></p>
                    <ul>
                      <li>HTTPS encryption for all data transmission</li>
                      <li>No permanent storage of uploaded files</li>
                      <li>Processing in secure, isolated environments</li>
                      <li>No sharing of data with third parties</li>
                    </ul>
                    <p>Files are automatically deleted after processing, and no personal financial information is retained.</p>
                  </div>
                )
              },
              {
                id: 'tax-years',
                header: 'Which tax years are supported?',
                content: (
                  <div>
                    <p>We support multiple UK tax years with the latest tax rates and allowances:</p>
                    <ul>
                      <li><strong>2024-25:</strong> Current tax year with updated CGT rates (18%/24% for shares)</li>
                      <li><strong>2023-24:</strong> Previous tax year (10%/20% for shares)</li>
                      <li><strong>2022-23:</strong> Historical calculations available</li>
                      <li><strong>2021-22:</strong> Archive year support</li>
                    </ul>
                    <div className="alert alert-warning mt-3">
                      <strong>Important:</strong> CGT rates for shares increased significantly from 30 October 2024. 
                      Make sure to select the correct tax year for accurate results.
                    </div>
                  </div>
                )
              }
            ]}
            defaultExpanded={['file-formats']}
            allowMultiple={false}
            flush={true}
          />
        </div>
      </div>

      {/* Testimonials/Social Proof Section */}
      <div className="row mt-5 mb-5">
        <div className="col-12">
          <div className="bg-light rounded p-5">
            <div className="text-center mb-4">
              <h2 className="display-6 fw-bold text-primary">Trusted by UK Investors</h2>
              <p className="lead text-muted">Join thousands of investors who trust our calculations</p>
            </div>
            
            <div className="row g-4">
              <div className="col-md-6">
                <Card className="h-100 border-0 shadow-sm">
                  <div className="card-body p-4">
                    <div className="d-flex mb-3">
                      <div className="text-warning me-1">★★★★★</div>
                    </div>
                    <p className="card-text">
                      "Finally, a UK tax calculator that handles IBKR transactions properly! 
                      The Section 104 pooling calculations are spot-on and saved me hours of manual work."
                    </p>
                    <div className="d-flex align-items-center mt-3">
                      <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" 
                           style={{ width: '40px', height: '40px', fontSize: '14px' }}>
                        JM
                      </div>
                      <div>
                        <strong>James M.</strong>
                        <div className="text-muted small">IBKR Portfolio Manager</div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
              
              <div className="col-md-6">
                <Card className="h-100 border-0 shadow-sm">
                  <div className="card-body p-4">
                    <div className="d-flex mb-3">
                      <div className="text-warning me-1">★★★★★</div>
                    </div>
                    <p className="card-text">
                      "Professional-quality calculations with detailed reporting. 
                      My accountant was impressed with the accuracy and comprehensive breakdown."
                    </p>
                    <div className="d-flex align-items-center mt-3">
                      <div className="bg-success text-white rounded-circle d-flex align-items-center justify-content-center me-3" 
                           style={{ width: '40px', height: '40px', fontSize: '14px' }}>
                        SC
                      </div>
                      <div>
                        <strong>Sarah C.</strong>
                        <div className="text-muted small">Investment Portfolio Owner</div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
            
            <div className="text-center mt-4">
              <div className="row justify-content-center">
                <div className="col-auto">
                  <div className="d-flex align-items-center text-muted">
                    <i className="fas fa-users me-2"></i>
                    <span>Trusted by 10,000+ UK investors</span>
                  </div>
                </div>
                <div className="col-auto">
                  <div className="d-flex align-items-center text-muted">
                    <i className="fas fa-file-invoice me-2"></i>
                    <span>50,000+ calculations processed</span>
                  </div>
                </div>
                <div className="col-auto">
                  <div className="d-flex align-items-center text-muted">
                    <i className="fas fa-shield-check me-2"></i>
                    <span>HMRC compliant results</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Tax Education Resources Section */}
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
              columns={{ xs: 1, sm: 2, md: 3 }}
              showRatings={true}
              showCategories={false}
              layout="vertical"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalculatorPage;
