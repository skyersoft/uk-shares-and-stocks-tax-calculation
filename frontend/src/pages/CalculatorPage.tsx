import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCalculation } from '../context/CalculationContext';
import { submitCalculation, CSVValidationError } from '../services/api';
import { MultiStepCalculator } from '../components/calculator/MultiStepCalculator';
import { normalizeCalculationResults } from '../utils/resultsNormalizer';
import {
  trackCalculationStart,
  trackCalculationSuccess,
  trackCalculationError,
  trackFileUpload,
} from '../utils/analytics';

import SEOHead from '../components/seo/SEOHead';

const CalculatorPage: React.FC = () => {
  console.log('[CalculatorPage] Rendering component');
  const { dispatch } = useCalculation();
  const navigate = useNavigate();

  // Handle form completion from MultiStepCalculator
  const handleCalculatorComplete = async (data: any) => {
    console.log('[CalculatorPage] Calculator completed with data:', data);
    console.log('[CalculatorPage] Broker files:', data.brokerFiles);
    console.log('[CalculatorPage] Tax year:', data.taxYear);
    console.log('[CalculatorPage] Analysis type:', data.analysisType);

    dispatch({ type: 'SUBMIT_START' });

    try {
      // Extract all broker files
      const files = data.brokerFiles && data.brokerFiles.length > 0
        ? data.brokerFiles.map((bf: any) => bf.file)
        : [];

      console.log('[CalculatorPage] Files to submit:', files.length);

      if (files.length === 0) {
        console.error('[CalculatorPage] No files uploaded');
        throw new Error('No files uploaded for calculation');
      }

      // Track file upload
      const fileType = files[0].name.toLowerCase().endsWith('.qfx') ? 'qfx' : 'csv';
      trackFileUpload(files.length, fileType);

      // Track calculation start
      trackCalculationStart(data.taxYear, data.analysisType || 'both', files.length);

      console.log('[CalculatorPage] Submitting calculation...');
      const startTime = Date.now();
      const results = await submitCalculation({
        files,
        taxYear: data.taxYear,
        analysisType: data.analysisType || 'both'
      });

      console.log('[CalculatorPage] Calculation results received:', results);
      const normalized = normalizeCalculationResults(results.raw);
      console.log('[CalculatorPage] Results normalized:', normalized);

      // Track calculation success
      const processingTime = Date.now() - startTime;
      trackCalculationSuccess(
        data.taxYear,
        results.raw.transaction_count || 0,
        processingTime,
        results.raw.disposal_events?.length || 0
      );

      dispatch({
        type: 'SUBMIT_SUCCESS',
        payload: {
          raw: results.raw,
          normalized,
          wizardData: data
        }
      });

      console.log('[CalculatorPage] Navigating to results...');
      // Navigate to results
      navigate('/results');
      console.log('[CalculatorPage] Navigation complete, routed to /results');
    } catch (error: any) {
      console.error('[CalculatorPage] Submission error:', error);

      // Track calculation error
      const errorType = error instanceof CSVValidationError
        ? 'csv_validation_error'
        : 'calculation_error';
      trackCalculationError(errorType, error.message || 'Unknown error');

      // Handle CSV validation errors with detailed information
      if (error instanceof CSVValidationError) {
        const missingCols = error.missing_columns.join(', ');
        const requiredCols = error.required_columns.join(', ');
        const detailedMessage = `Invalid CSV format.\n\nMissing columns: ${missingCols}\n\nRequired columns: ${requiredCols}\n\nPlease check your CSV file format and try again.`;
        dispatch({ type: 'SUBMIT_ERROR', payload: detailedMessage });
      } else {
        dispatch({ type: 'SUBMIT_ERROR', payload: error.message || 'An error occurred during calculation' });
      }
    }
  };

  return (
    <div className="calculator-page">
      <SEOHead
        title="Calculate UK Capital Gains Tax - Free Online Tool"
        description="Free online calculator for UK Capital Gains Tax (CGT). Supports Interactive Brokers, Trading 212, and CSV uploads. Follows HMRC rules."
        keywords={['UK CGT calculator', 'capital gains tax calculator', 'free tax calculator', 'HMRC tax tool']}
        canonical="https://cgttaxtool.uk/calculator"
      />
      <div className="calculator-content">
        {/* Modern Hero Section */}
        <section className="calculator-hero">
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-lg-10 text-center">
                <div className="calculator-hero-content fade-in-up">
                  <h1 className="mb-2">
                    UK Tax Calculator
                  </h1>
                  <p className="lead mb-2">
                    Calculate your Capital Gains Tax and income tax for informational purposes.
                    This tool follows HMRC guidelines but results are for reference only.
                  </p>
                  <div className="disclaimer-banner">
                    <div className="alert alert-warning border-0 mb-3 py-2">
                      <i className="bi bi-exclamation-triangle-fill me-2"></i>
                      <strong>Important:</strong> This calculator is for informational purposes only.
                      You are solely responsible for verifying calculations and submitting accurate information to HMRC.
                      Use at your own risk.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Multi-Step Calculator */}
        <section className="calculator-section py-3">
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-lg-10">
                <MultiStepCalculator onComplete={handleCalculatorComplete} />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default CalculatorPage;
