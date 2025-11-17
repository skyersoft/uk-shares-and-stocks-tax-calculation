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
    
    dispatch({ type: 'SUBMIT_START' });

    try {
      const results = await submitCalculation({
        file: data.file,
        taxYear: data.taxYear,
        analysisType: 'both' // Default to both for now
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
