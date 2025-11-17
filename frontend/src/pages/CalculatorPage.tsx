import React from 'react';
import { useCalculation } from '../context/CalculationContext';
import { submitCalculation } from '../services/api';
import { MultiStepCalculator } from '../components/calculator/MultiStepCalculator';
import { normalizeCalculationResults } from '../utils/resultsNormalizer';

const CalculatorPage: React.FC = () => {
  console.log('[CalculatorPage] Rendering component');
  const { state, dispatch } = useCalculation();

  // Handle form completion from MultiStepCalculator
  const handleCalculatorComplete = async (data: any) => {
    console.log('[CalculatorPage] Calculator completed with data:', data);
    console.log('[CalculatorPage] Broker files:', data.brokerFiles);
    console.log('[CalculatorPage] Tax year:', data.taxYear);
    console.log('[CalculatorPage] Analysis type:', data.analysisType);
    
    dispatch({ type: 'SUBMIT_START' });

    try {
      // Extract the first broker file if available
      const primaryFile = data.brokerFiles && data.brokerFiles.length > 0 
        ? data.brokerFiles[0].file 
        : null;

      console.log('[CalculatorPage] Primary file:', primaryFile);

      if (!primaryFile) {
        console.error('[CalculatorPage] No file uploaded');
        throw new Error('No file uploaded for calculation');
      }

      console.log('[CalculatorPage] Submitting calculation...');
      const results = await submitCalculation({
        file: primaryFile,
        taxYear: data.taxYear,
        analysisType: data.analysisType || 'both'
      });

      console.log('[CalculatorPage] Calculation results received:', results);
      const normalized = normalizeCalculationResults(results.raw);
      console.log('[CalculatorPage] Results normalized:', normalized);
      
      dispatch({ type: 'SUBMIT_SUCCESS', payload: { raw: results.raw, normalized } });
      
      console.log('[CalculatorPage] Navigating to results...');
      // Navigate to results
      window.location.hash = 'results';
      console.log('[CalculatorPage] Navigation complete, hash:', window.location.hash);
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
              <div className="col-lg-10 text-center">
                <div className="calculator-hero-content fade-in-up">
                  <h1 className="mb-4">
                    UK Tax Calculator
                  </h1>
                  <p className="lead mb-4">
                    Calculate your Capital Gains Tax and income tax for informational purposes. 
                    This tool follows HMRC guidelines but results are for reference only.
                  </p>
                  <div className="disclaimer-banner">
                    <div className="alert alert-warning border-0 mb-4">
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
        <section className="calculator-section py-5">
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
