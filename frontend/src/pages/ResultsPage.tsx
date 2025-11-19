import React, { useMemo, useState } from 'react';
import { useCalculation } from '../context/CalculationContext';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { PortfolioSummary } from '../components/results/PortfolioSummary';
import { ResultsHoldingsTable } from '../components/results/HoldingsTable';
import { TaxCalculations } from '../components/results/TaxCalculations';
import DataVisualization from '../components/results/DataVisualization';
import {
  NormalizedResults,
  PortfolioAnalysis,
  TaxCalculation
} from '../types/calculation';
import { AffiliateGrid } from '../components/affiliate';
import { ResultsMetricsSummary } from '../components/results/ResultsMetrics';
import { ResultsDisposalsTable } from '../components/results/ResultsDisposalsTable';
import { ResultsDividendsTable } from '../components/results/ResultsDividendsTable';
import { ResultsCallToAction } from '../components/results/ResultsCallToAction';
import { AdditionalIncomeInputs } from '../components/results/AdditionalIncomeInputs';
import { normalizeCalculationResults } from '../utils/resultsNormalizer';
import { DisposalDetailsTable } from '../components/results/DisposalDetailsTable';
import { CashBalancesTable } from '../components/results/CashBalancesTable';

interface AdditionalIncomeData {
  otherIncome: number;
  otherDividends: number;
  otherCapitalGains: number;
}

const ResultsPage: React.FC = () => {
  const { state } = useCalculation();
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

  const handleAdditionalIncomeCalculate = (data: AdditionalIncomeData) => {
    setAdditionalIncome(data);
  };

  const taxYearDisplay = normalizedResults?.taxYear ?? 'N/A';

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
              <p className="mb-3">
                {state.error || 'An unexpected error occurred while processing your calculation.'}
              </p>
              <Button
                variant="primary"
                onClick={() => (window.location.hash = '')}
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
              onClick={() => (window.location.hash = '')}
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
              <Button variant="primary" onClick={() => (window.location.hash = '')}>
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
      className="container-fluid py-4"
      style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}
    >
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
                onClick={() => (window.location.hash = '')}
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

      <ResultsMetricsSummary
        metrics={normalizedResults.metrics}
        taxYear={normalizedResults.taxYear}
        showCgtWarning={normalizedResults.showCgtWarning}
        className="mb-4"
      />

      <div className="row mb-4">
        <div className="col-12">
          <AdditionalIncomeInputs
            onCalculate={handleAdditionalIncomeCalculate}
            className="shadow-sm border-0"
          />
        </div>
      </div>

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

      <div className="row mb-4">
        <div className="col-12">
          <PortfolioSummary
            portfolioAnalysis={portfolioAnalysis}
            className="shadow-sm border-0"
          />
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-12">
          <ResultsDisposalsTable
            disposals={normalizedResults.disposals}
            className="shadow-sm border-0"
          />
        </div>
      </div>

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

      <div className="row mb-4">
        <div className="col-12">
          <ResultsDividendsTable
            dividends={normalizedResults.dividends}
            className="shadow-sm border-0"
          />
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-12">
          <ResultsHoldingsTable
            holdings={normalizedResults.holdings}
            marketSummaries={portfolioAnalysis.market_summaries}
            className="shadow-sm border-0"
          />
        </div>
      </div>

      {taxCalculations && (
        <div className="row mb-4">
          <div className="col-12">
            <TaxCalculations
              taxCalculations={taxCalculations}
              className="shadow-sm border-0"
            />
          </div>
        </div>
      )}

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
              <Button variant="primary" onClick={() => (window.location.hash = '')}>
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
    </div>
  );
};

export default ResultsPage;
