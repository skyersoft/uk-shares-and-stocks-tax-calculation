import React, { useMemo } from 'react';
import { useCalculation } from '../context/CalculationContext';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { PortfolioSummary } from '../components/results/PortfolioSummary';
import { ResultsHoldingsTable } from '../components/results/HoldingsTable';
import { TaxCalculations } from '../components/results/TaxCalculations';
import DataVisualization from '../components/results/DataVisualization';
import { PortfolioAnalysis, TaxCalculation } from '../types/calculation';
import { AffiliateGrid } from '../components/affiliate';

const ResultsPage: React.FC = () => {
  const { state } = useCalculation();

  // Transform raw data to our typed interfaces
  const portfolioAnalysis: PortfolioAnalysis | null = useMemo(() => {
    if (!state.raw?.portfolio_analysis) return null;
    return state.raw.portfolio_analysis;
  }, [state.raw]);

  const taxCalculations: TaxCalculation | null = useMemo(() => {
    if (!state.raw?.tax_analysis) return null;

    // The backend provides estimated tax figures under tax_report.summary.estimated_tax_liability
    // but the UI expects a flattened TaxCalculation object with capital_gains_tax, dividend_tax, etc.
    const estimated = state.raw.tax_report?.summary?.estimated_tax_liability || {};
    const capitalGains = state.raw.tax_analysis.capital_gains || {};

    // Build disposal calculations in the simplified shape expected by the UI
    const disposal_calculations = (capitalGains.disposals || []).map((d: any) => {
      const proceeds = Number(d.proceeds) || 0;
      const cost_basis = Number(d.cost_basis) || 0;
      const expenses = Number(d.expenses) || 0;
      const gain_loss = proceeds - cost_basis - expenses;
      return {
        symbol: d.security?.symbol || 'UNKNOWN',
        disposal_date: d.sell_date || d.disposal_date || '',
        quantity: d.quantity || 0,
        proceeds,
        gain_loss,
      };
    });

    // Section 104 pools not yet exposed separately by backend summary; keep empty for now
    const section_104_pools: Record<string, any> = {};

    return {
      capital_gains_tax: Number(estimated.capital_gains_tax) || 0,
      dividend_tax: Number(estimated.dividend_tax) || 0,
      total_tax_liability: (
        Number(estimated.total_estimated_tax) ||
        (Number(estimated.capital_gains_tax) || 0) +
          (Number(estimated.dividend_tax) || 0) +
          (Number(estimated.currency_gains_tax) || 0)
      ),
      section_104_pools,
      disposal_calculations,
    } as TaxCalculation;
  }, [state.raw]);

  // Handle loading and error states
  if (state.status === 'submitting') {
    return (
      <div className="container-fluid py-4">
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 text-center">
            <LoadingSpinner size="lg" className="mb-3" />
            <h3 className="text-primary">Processing Your Tax Calculation</h3>
            <p className="text-muted">
              Please wait while we analyse your portfolio and calculate your tax obligations...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="container-fluid py-4">
        <div className="row justify-content-center">
          <div className="col-12 col-md-8">
            <Alert variant="danger" className="text-center">
              <div className="d-flex align-items-center justify-content-center mb-2">
                <i className="fas fa-exclamation-triangle me-2"></i>
                <h4 className="mb-0">Calculation Error</h4>
              </div>
              <p className="mb-3">{state.error || 'An unexpected error occurred while processing your calculation.'}</p>
              <Button 
                variant="primary"
                onClick={() => window.location.hash = ''}
                className="me-2"
              >
                <i className="fas fa-calculator me-2"></i>
                Try Again
              </Button>
            </Alert>
          </div>
        </div>
      </div>
    );
  }

  if (state.status === 'idle') {
    return (
      <div className="container-fluid py-4">
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 text-center">
            <div className="mb-4">
              <i className="fas fa-chart-line text-primary" style={{ fontSize: '4rem' }}></i>
            </div>
            <h2 className="text-primary mb-3">No Calculation Results</h2>
            <p className="text-muted mb-4">
              Upload your brokerage files and run a calculation to see your tax results here.
            </p>
            <Button 
              variant="primary" 
              size="lg"
              onClick={() => window.location.hash = ''}
            >
              <i className="fas fa-calculator me-2"></i>
              Start Tax Calculation
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Success state - show results
  if (!portfolioAnalysis || !taxCalculations) {
    return (
      <div className="container-fluid py-4">
        <div className="row justify-content-center">
          <div className="col-12 col-md-8">
            <Alert variant="warning" className="text-center">
              <h4>Incomplete Data</h4>
              <p>The calculation completed but some results data is missing. Please try running the calculation again.</p>
              <Button variant="primary" onClick={() => window.location.hash = ''}>
                Run New Calculation
              </Button>
            </Alert>
          </div>
        </div>
      </div>
    );
  }

  // Main results layout
  return (
    <div className="container-fluid py-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      {/* Page Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center bg-white rounded shadow-sm p-4">
            <div>
              <h1 className="h2 mb-1 text-primary">
                <i className="fas fa-chart-line me-3"></i>
                Tax Calculation Results
              </h1>
              <p className="text-muted mb-0">
                Comprehensive analysis of your portfolio and UK tax obligations
              </p>
            </div>
            <div className="text-end">
              <Button 
                variant="outline-primary"
                size="sm"
                onClick={() => window.location.hash = ''}
                className="me-2"
              >
                <i className="fas fa-calculator me-2"></i>
                New Calculation
              </Button>
              <Button 
                variant="outline-secondary"
                size="sm"
                onClick={() => window.print()}
              >
                <i className="fas fa-print me-2"></i>
                Print Results
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Success Alert for Tax Liability */}
      {taxCalculations.total_tax_liability > 0 && (
        <div className="row mb-4">
          <div className="col-12">
            <Alert variant="warning" className="border-0 shadow-sm">
              <div className="d-flex align-items-center">
                <i className="fas fa-exclamation-triangle me-3" style={{ fontSize: '1.5rem' }}></i>
                <div>
                  <h5 className="mb-1">Tax Liability Identified</h5>
                  <p className="mb-0">
                    Your portfolio analysis shows a potential tax liability of{' '}
                    <strong>
                      {new Intl.NumberFormat('en-GB', {
                        style: 'currency',
                        currency: 'GBP'
                      }).format(taxCalculations.total_tax_liability)}
                    </strong>
                    . Please consult with a qualified tax advisor to confirm your obligations.
                  </p>
                </div>
              </div>
            </Alert>
          </div>
        </div>
      )}

      {/* Portfolio Summary */}
      <div className="row mb-4">
        <div className="col-12">
          <PortfolioSummary 
            portfolioAnalysis={portfolioAnalysis}
            className="shadow-sm border-0"
          />
        </div>
      </div>

      {/* Holdings Table */}
      <div className="row mb-4">
        <div className="col-12">
          <ResultsHoldingsTable 
            marketSummaries={portfolioAnalysis.market_summaries}
            className="shadow-sm border-0"
          />
        </div>
      </div>

      {/* Tax Calculations */}
      <div className="row mb-4">
        <div className="col-12">
          <TaxCalculations 
            taxCalculations={taxCalculations}
            className="shadow-sm border-0"
          />
        </div>
      </div>

      {/* Data Visualization */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="bg-white rounded shadow-sm p-4">
            <div className="d-flex align-items-center mb-4">
              <i className="fas fa-chart-bar me-3 text-primary" style={{ fontSize: '1.5rem' }}></i>
              <div>
                <h4 className="mb-1">Portfolio Analytics</h4>
                <p className="text-muted mb-0">
                  Interactive charts and visualizations of your portfolio performance and tax analysis
                </p>
              </div>
            </div>
            <DataVisualization
              portfolioAnalysis={portfolioAnalysis}
              taxCalculations={taxCalculations}
            />
          </div>
        </div>
      </div>

      {/* Educational Resources Section */}
      <div className="row">
        <div className="col-12">
          <div className="bg-white rounded shadow-sm p-4 mb-4">
            <div className="text-center mb-4">
              <h4 className="text-dark mb-2">
                📈 Further Your Tax Knowledge
              </h4>
              <p className="text-muted">
                Based on your calculation complexity, these resources can help you understand tax implications better
              </p>
            </div>
            
            <AffiliateGrid
              featuredOnly={true}
              limit={3}
              columns={{ xs: 1, sm: 2, md: 3 }}
              showRatings={true}
              showCategories={true}
              layout="vertical"
              sortBy="rating"
            />
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="row">
        <div className="col-12">
          <div className="bg-white rounded shadow-sm p-4 text-center">
            <div className="mb-3">
              <h5 className="text-muted">Need Help?</h5>
              <p className="small text-muted mb-0">
                These calculations are estimates. For professional tax advice, consult with a qualified accountant or tax advisor.
              </p>
            </div>
            <div className="d-flex justify-content-center gap-3 flex-wrap">
              <Button 
                variant="primary"
                onClick={() => window.location.hash = ''}
              >
                <i className="fas fa-calculator me-2"></i>
                Run New Calculation
              </Button>
              <Button 
                variant="outline-secondary"
                onClick={() => window.location.href = '/'}
              >
                <i className="fas fa-home me-2"></i>
                Back to Home
              </Button>
              <Button 
                variant="outline-secondary"
                onClick={() => window.open('https://www.gov.uk/capital-gains-tax', '_blank')}
              >
                <i className="fas fa-external-link-alt me-2"></i>
                HMRC Guidance
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;
