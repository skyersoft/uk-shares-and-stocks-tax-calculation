import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCalculation } from '../context/CalculationContext';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { PortfolioSummary } from '../components/results/PortfolioSummary';
import DataVisualization from '../components/results/DataVisualization';
import {
  NormalizedResults,
  PortfolioAnalysis,
  TaxCalculation
} from '../types/calculation';
import { AffiliateGrid } from '../components/affiliate';
import { ResultsMetricsSummary } from '../components/results/ResultsMetrics';
import { ResultsCallToAction } from '../components/results/ResultsCallToAction';
import { AdditionalIncomeInputs } from '../components/results/AdditionalIncomeInputs';
import { normalizeCalculationResults } from '../utils/resultsNormalizer';
import { DisposalDetailsTable } from '../components/results/DisposalDetailsTable';
import { CashBalancesTable } from '../components/results/CashBalancesTable';
import { CalculationParameters } from '../components/results/CalculationParameters';
import { DetailedTaxBreakdown } from '../components/results/DetailedTaxBreakdown';
import { ResultsTabs } from '../components/results/ResultsTabs';
import { calculateComprehensiveTax } from '../utils/comprehensiveTaxCalculation';
import SEOHead from '../components/seo/SEOHead';
import { UnrealisedGainsResults } from '../components/results/UnrealisedGainsResults';
import { UnrealisedGainsResult } from '../types/calculation';
import { TimelineResponse } from '../types/timeline';

interface AdditionalIncomeData {
  otherIncome: number;
  otherDividends: number;
  otherCapitalGains: number;
}

const ResultsPage: React.FC = () => {
  const { state } = useCalculation();
  const navigate = useNavigate();
  const [additionalIncome, setAdditionalIncome] = useState<AdditionalIncomeData>({
    otherIncome: 0,
    otherDividends: 0,
    otherCapitalGains: 0
  });

  const normalizedResults: NormalizedResults | null = useMemo(() => {
    if (state.result) return state.result;
    if (state.raw) return normalizeCalculationResults(state.raw);
    return null;
  }, [state.result, state.raw]);

  const portfolioAnalysis: PortfolioAnalysis | null = useMemo(() => {
    if (normalizedResults?.portfolioAnalysis) return normalizedResults.portfolioAnalysis;
    if (state.raw?.portfolio_analysis) return state.raw.portfolio_analysis;
    return null;
  }, [normalizedResults, state.raw]);

  const taxCalculations: TaxCalculation | null = useMemo(() => {
    const taxReport = normalizedResults?.taxReport ?? state.raw?.tax_report;
    const taxAnalysis = normalizedResults?.taxAnalysis ?? state.raw?.tax_analysis;

    if (!taxReport?.summary?.estimated_tax_liability) return null;

    const estimated = taxReport.summary.estimated_tax_liability || {};
    const sectionPools =
      taxAnalysis?.capital_gains?.section_104_pools || estimated.section_104_pools || {};

    const disposalSource: any[] = Array.isArray(normalizedResults?.disposals)
      ? normalizedResults.disposals
      : Array.isArray(taxAnalysis?.capital_gains?.disposals)
        ? taxAnalysis.capital_gains.disposals
        : [];

    const disposal_calculations = disposalSource.map((disposal: any) => {
      const isNormalized = Object.prototype.hasOwnProperty.call(disposal, 'disposalDate');
      const proceeds = isNormalized ? disposal.proceeds || 0 : Number(disposal.proceeds) || 0;
      const expenses = isNormalized ? 0 : Number(disposal.expenses) || 0;
      const costBasis = isNormalized ? disposal.costBasis || 0 : Number(disposal.cost_basis) || 0;
      const gainLoss = isNormalized
        ? disposal.gainLoss || 0
        : Number(disposal.gain_or_loss) || proceeds - costBasis - expenses;

      const disposalDate = isNormalized
        ? disposal.disposalDate
        : disposal.disposal_date || disposal.sell_date || disposal.date || '';

      return {
        symbol: isNormalized
          ? disposal.symbol || 'UNKNOWN'
          : disposal.security?.symbol || disposal.symbol || 'UNKNOWN',
        disposal_date: disposalDate,
        quantity: isNormalized ? disposal.quantity || 0 : Number(disposal.quantity) || 0,
        proceeds,
        gain_loss: gainLoss
      };
    });

    // Base tax from portfolio
    const baseCGT = Number(estimated.capital_gains_tax) || 0;
    const baseDivTax = Number(estimated.dividend_tax) || 0;

    // Add additional income tax calculations (simplified)
    // In reality, these would need proper tax bands and calculations
    const additionalCGT = additionalIncome.otherCapitalGains * 0.2; // Simplified 20% rate
    const additionalDivTax = additionalIncome.otherDividends * 0.0875; // Simplified 8.75% basic rate

    return {
      capital_gains_tax: baseCGT + additionalCGT,
      dividend_tax: baseDivTax + additionalDivTax,
      total_tax_liability:
        baseCGT + additionalCGT + baseDivTax + additionalDivTax +
        (Number(estimated.currency_gains_tax) || 0),
      section_104_pools: sectionPools,
      disposal_calculations,
      additional_income: additionalIncome
    } as TaxCalculation;
  }, [normalizedResults, state.raw, additionalIncome]);

  // Calculate comprehensive tax including all wizard inputs
  const comprehensiveTax = useMemo(() => {
    if (!normalizedResults) return null;
    const taxYear = state.wizardData?.taxYear || normalizedResults.taxYear || '2025-2026';
    return calculateComprehensiveTax(normalizedResults, state.wizardData, taxYear);
  }, [normalizedResults, state.wizardData]);

  // Create corrected metrics with comprehensive tax liability
  const correctedMetrics = useMemo(() => {
    if (!normalizedResults) return null;
    return {
      ...normalizedResults.metrics,
      totalTaxLiability: comprehensiveTax?.totalTaxLiability || normalizedResults.metrics.totalTaxLiability
    };
  }, [normalizedResults, comprehensiveTax]);

  const handleAdditionalIncomeCalculate = (data: AdditionalIncomeData) => {
    setAdditionalIncome(data);
  };

  const taxYearDisplay = normalizedResults?.taxYear ?? 'N/A';

  // Detect unrealised gains response shape
  const unrealisedGainsData: UnrealisedGainsResult | null = useMemo(() => {
    if (
      state.raw &&
      state.raw.predictive_cgt &&
      Array.isArray(state.raw.positions)
    ) {
      return state.raw as UnrealisedGainsResult;
    }
    return null;
  }, [state.raw]);

  // Extract timeline data from context (fetched in parallel by CalculatorPage)
  const timelineData: TimelineResponse | null = useMemo(() => {
    if (
      state.timelineRaw &&
      Array.isArray(state.timelineRaw.events) &&
      state.timelineRaw.summary
    ) {
      return state.timelineRaw as TimelineResponse;
    }
    return null;
  }, [state.timelineRaw]);

  if (state.status === 'submitting') {
    return (
      <div className="container-fluid py-4">
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 text-center">
            <LoadingSpinner size="lg" className="mb-3" />
            <h3 className="text-primary">
              {state.wizardData?.analysisType === 'unrealised_gains'
                ? 'Fetching Live Market Prices'
                : 'Processing Your Tax Calculation'}
            </h3>
            <p className="text-muted">
              {state.wizardData?.analysisType === 'unrealised_gains'
                ? 'Fetching live prices and running predictive CGT simulation — this may take a moment…'
                : 'Please wait while we analyse your portfolio and calculate your tax obligations...'}
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
              <p className="mb-3">
                {state.error || 'An unexpected error occurred while processing your calculation.'}
              </p>
              <Button
                variant="primary"
                onClick={() => navigate('/calculator')}
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
              onClick={() => navigate('/calculator')}
            >
              <i className="fas fa-calculator me-2"></i>
              Start Tax Calculation
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!normalizedResults || !portfolioAnalysis || !taxCalculations) {
    // Show unrealised gains view if the raw response is from /unrealised-gains
    if (unrealisedGainsData) {
      return (
        <div
          style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}
          className="py-4"
        >
          <div className="container-xxl">
            <div className="row gx-4">
              <aside className="col-xl-2 d-none d-xl-block">
                <div className="ad-column start-ad-slot" aria-hidden="true" />
              </aside>
              <div className="col-12 col-xl-8">
          <SEOHead
            title="Unrealised Gains & Predictive Tax - UK Stock Tax Calculator"
            description="See your unrealised gains and estimated UK capital gains tax if you sold all positions today."
            robots="noindex, nofollow"
          />
          <div className="row mb-4">
            <div className="col-12">
              <div className="d-flex justify-content-between align-items-center bg-white rounded shadow-sm p-4 flex-wrap gap-3">
                <div>
                  <h1 className="h2 mb-1 text-primary">
                    <i className="fas fa-chart-area me-3"></i>
                    Unrealised Gains Report
                  </h1>
                  <p className="text-muted mb-0">
                    Live market prices · Predictive UK Capital Gains Tax
                  </p>
                </div>
                <div className="text-end">
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => navigate('/calculator')}
                    className="me-2"
                  >
                    <i className="fas fa-calculator me-2"></i>
                    New Calculation
                  </Button>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => navigate('/print-report')}
                  >
                    <i className="fas fa-print me-2"></i>
                    Print Report
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-12">
              <UnrealisedGainsResults data={unrealisedGainsData} />
            </div>
          </div>
              </div>{/* col-12 col-xl-8 */}
              <aside className="col-xl-2 d-none d-xl-block">
                <div className="ad-column end-ad-slot" aria-hidden="true" />
              </aside>
            </div>{/* row gx-4 */}
          </div>{/* container-xxl */}
        </div>
      );
    }

    return (
      <div className="container-fluid py-4">
        <div className="row justify-content-center">
          <div className="col-12 col-md-8">
            <Alert variant="warning" className="text-center">
              <h4>Incomplete Data</h4>
              <p>
                The calculation completed but some results data is missing. Please try running the
                calculation again.
              </p>
              <Button variant="primary" onClick={() => navigate('/calculator')}>
                Run New Calculation
              </Button>
            </Alert>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}
      className="py-4"
    >
      <div className="container-xxl">
        <div className="row gx-4">
          <aside className="col-xl-2 d-none d-xl-block">
            <div className="ad-column start-ad-slot" aria-hidden="true" />
          </aside>
          <div className="col-12 col-xl-8">
      <SEOHead
        title="Calculation Results - UK Stock Tax Calculator"
        description="View your detailed UK capital gains tax calculation results, including Section 104 pools, dividend tax, and portfolio analysis."
        robots="noindex, nofollow"
      />
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center bg-white rounded shadow-sm p-4 flex-wrap gap-3">
            <div>
              <h1 className="h2 mb-1 text-primary">
                <i className="fas fa-chart-line me-3"></i>
                Tax Calculation Results
              </h1>
              <p className="text-muted mb-0">
                Comprehensive analysis of your portfolio and UK tax obligations
              </p>
              <div className="small text-muted mt-2">
                <strong>Tax Year:</strong> {taxYearDisplay}
              </div>
            </div>
            <div className="text-end">
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => navigate('/calculator')}
                className="me-2"
              >
                <i className="fas fa-calculator me-2"></i>
                New Calculation
              </Button>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => navigate('/print-report')}
              >
                <i className="fas fa-print me-2"></i>
                Print Results
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Executive Summary */}
      <ResultsMetricsSummary
        metrics={correctedMetrics || normalizedResults.metrics}
        taxYear={normalizedResults.taxYear}
        showCgtWarning={normalizedResults.showCgtWarning}
        className="mb-4"
      />

      {/* Calculation Parameters (Collapsible) */}
      {state.wizardData && (
        <div className="row mb-4">
          <div className="col-12">
            <details className="calculation-parameters-details">
              <summary className="cursor-pointer">
                <div className="card shadow-sm border-0">
                  <div className="card-body p-3">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="mb-0 text-primary">
                          <i className="fas fa-sliders-h me-2"></i>
                          Calculation Parameters
                        </h6>
                        <small className="text-muted">
                          Click to view the data used for this calculation
                        </small>
                      </div>
                      <i className="fas fa-chevron-down text-muted"></i>
                    </div>
                  </div>
                </div>
              </summary>
              <div className="mt-3">
                <CalculationParameters
                  data={state.wizardData}
                  className="shadow-sm border-0"
                />
              </div>
            </details>
          </div>
        </div>
      )}

      {/* Detailed Tax Breakdown */}
      <div className="row mb-4">
        <div className="col-12">
          <DetailedTaxBreakdown
            normalizedResults={normalizedResults}
            wizardData={state.wizardData}
            taxCalculations={taxCalculations}
            className="shadow-sm border-0"
          />
        </div>
      </div>

      {/* Portfolio Summary */}
      <div className="row mb-4">
        <div className="col-12">
          <PortfolioSummary
            portfolioAnalysis={portfolioAnalysis}
            className="shadow-sm border-0"
          />
        </div>
      </div>

      {/* Additional Income Inputs */}
      <div className="row mb-4">
        <div className="col-12">
          <AdditionalIncomeInputs
            onCalculate={handleAdditionalIncomeCalculate}
            className="shadow-sm border-0"
          />
        </div>
      </div>

      {/* Detailed Transaction Data (Tabs) */}
      <div className="row mb-4">
        <div className="col-12">
          <ResultsTabs
            normalizedResults={normalizedResults}
            portfolioAnalysis={portfolioAnalysis}
            taxCalculations={taxCalculations}
            timelineData={timelineData}
            className="shadow-sm border-0"
          />
        </div>
      </div>

      {/* Additional Tables (if available) */}
      {state.raw?.disposal_events && state.raw.disposal_events.length > 0 && (
        <div className="row mb-4">
          <div className="col-12">
            <DisposalDetailsTable
              disposalEvents={state.raw.disposal_events}
              className="shadow-sm border-0"
            />
          </div>
        </div>
      )}

      {state.raw?.currency_balances && state.raw.currency_balances.length > 0 && (
        <div className="row mb-4">
          <div className="col-12">
            <CashBalancesTable
              currencyBalances={state.raw.currency_balances}
              className="shadow-sm border-0"
            />
          </div>
        </div>
      )}

      {/* Data Visualization */}
      <div className="row mb-4">
        <div className="col-12">
          <DataVisualization
            portfolioAnalysis={portfolioAnalysis}
            taxCalculations={taxCalculations}
          />
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-12">
          <ResultsCallToAction />
        </div>
      </div>

      <div className="row">
        <div className="col-12">
          <div className="bg-white rounded shadow-sm p-4 mb-4">
            <div className="text-center mb-4">
              <h4 className="text-dark mb-2">📈 Further Your Tax Knowledge</h4>
              <p className="text-muted">
                Based on your calculation complexity, these resources can help you understand tax
                implications better
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

      <div className="row">
        <div className="col-12">
          <div className="bg-white rounded shadow-sm p-4 text-center">
            <div className="mb-3">
              <h5 className="text-muted">Need Help?</h5>
              <p className="small text-muted mb-0">
                These calculations are estimates. For professional tax advice, consult with a
                qualified accountant or tax advisor.
              </p>
            </div>
            <div className="d-flex justify-content-center gap-3 flex-wrap">
              <Button variant="primary" onClick={() => navigate('/calculator')}>
                <i className="fas fa-calculator me-2"></i>
                Run New Calculation
              </Button>
              <Button
                variant="outline-secondary"
                onClick={() => (window.location.href = '/')}
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
          </div>{/* col-12 col-xl-8 */}
          <aside className="col-xl-2 d-none d-xl-block">
            <div className="ad-column end-ad-slot" aria-hidden="true" />
          </aside>
        </div>{/* row gx-4 */}
      </div>{/* container-xxl */}
    </div>
  );
};

export default ResultsPage;
