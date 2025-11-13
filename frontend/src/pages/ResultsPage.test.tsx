import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ResultsPage from './ResultsPage';
import { CalculationProvider } from '../context/CalculationContext';
import { NormalizedResults } from '../types/calculation';

interface CalculationState {
  status: 'idle' | 'submitting' | 'success' | 'error';
  error: string | null;
  result: NormalizedResults | null;
  raw: any | null;
}

jest.mock('../components/results/PortfolioSummary', () => ({
  __esModule: true,
  PortfolioSummary: ({ portfolioAnalysis, className }: any) => (
    <div data-testid="portfolio-summary" className={className}>
      Portfolio Summary - Total: £{portfolioAnalysis.total_portfolio_value}
    </div>
  ),
  default: ({ portfolioAnalysis, className }: any) => (
    <div data-testid="portfolio-summary" className={className}>
      Portfolio Summary - Total: £{portfolioAnalysis.total_portfolio_value}
    </div>
  )
}));

jest.mock('../components/results/HoldingsTable', () => ({
  __esModule: true,
  ResultsHoldingsTable: ({ holdings = [], marketSummaries = {}, className }: any) => (
    <div data-testid="holdings-table" className={className}>
      Holdings Table - {holdings.length} holdings / {Object.keys(marketSummaries || {}).length} currencies
    </div>
  ),
  default: ({ holdings = [], marketSummaries = {}, className }: any) => (
    <div data-testid="holdings-table" className={className}>
      Holdings Table - {holdings.length} holdings / {Object.keys(marketSummaries || {}).length} currencies
    </div>
  )
}));

jest.mock('../components/results/TaxCalculations', () => ({
  __esModule: true,
  TaxCalculations: ({ taxCalculations, className }: any) => (
    <div data-testid="tax-calculations" className={className}>
      Tax Calculations - Total Tax: £{taxCalculations.total_tax_liability}
    </div>
  ),
  default: ({ taxCalculations, className }: any) => (
    <div data-testid="tax-calculations" className={className}>
      Tax Calculations - Total Tax: £{taxCalculations.total_tax_liability}
    </div>
  )
}));

jest.mock('../components/results/DataVisualization', () => ({
  __esModule: true,
  default: ({ portfolioAnalysis, taxCalculations }: any) => (
    <div data-testid="data-visualization">
      Data Visualization - Portfolio: £{portfolioAnalysis.total_portfolio_value}, Tax: £{taxCalculations.total_tax_liability}
    </div>
  )
}));

jest.mock('../components/results/ResultsMetrics', () => ({
  __esModule: true,
  ResultsMetricsSummary: ({ className }: any) => (
    <div data-testid="results-metrics" className={className}>
      Results Metrics Summary
    </div>
  ),
  default: ({ className }: any) => (
    <div data-testid="results-metrics" className={className}>
      Results Metrics Summary
    </div>
  )
}));

jest.mock('../components/results/ResultsDisposalsTable', () => ({
  __esModule: true,
  ResultsDisposalsTable: ({ disposals, className }: any) => (
    <div data-testid="results-disposals" className={className}>
      Disposals Table - {disposals.length} rows
    </div>
  ),
  default: ({ disposals, className }: any) => (
    <div data-testid="results-disposals" className={className}>
      Disposals Table - {disposals.length} rows
    </div>
  )
}));

jest.mock('../components/results/ResultsDividendsTable', () => ({
  __esModule: true,
  ResultsDividendsTable: ({ dividends, className }: any) => (
    <div data-testid="results-dividends" className={className}>
      Dividends Table - {dividends.length} rows
    </div>
  ),
  default: ({ dividends, className }: any) => (
    <div data-testid="results-dividends" className={className}>
      Dividends Table - {dividends.length} rows
    </div>
  )
}));

jest.mock('../components/results/ResultsCallToAction', () => ({
  __esModule: true,
  ResultsCallToAction: ({ className }: any) => (
    <div data-testid="results-cta" className={className}>
      Results Call To Action
    </div>
  ),
  default: ({ className }: any) => (
    <div data-testid="results-cta" className={className}>
      Results Call To Action
    </div>
  )
}));

const mockNormalizedResults: NormalizedResults = {
  taxYear: '2024-2025',
  metrics: {
    totalTaxLiability: 2500,
    portfolioValue: 50000,
    totalReturnPercent: 10.5
  },
  disposals: [
    {
      disposalDate: '2024-04-05',
      symbol: 'ABC',
      quantity: 100,
      proceeds: 10000,
      costBasis: 7500,
      gainLoss: 2500
    }
  ],
  dividends: [
    {
      paymentDate: '2024-03-01',
      symbol: 'ABC',
      name: 'ABC Corp',
      grossAmount: 500,
      withholdingTax: 50,
      netAmount: 450
    }
  ],
  holdings: [
    {
      symbol: 'ABC',
      name: 'ABC Corp',
      quantity: 100,
      averageCostGBP: 75,
      currentValueGBP: 10000,
      totalCostGBP: 7500,
      unrealizedGainLoss: 2500,
      returnPct: 33.33
    },
    {
      symbol: 'XYZ',
      name: 'XYZ Ltd',
      quantity: 50,
      averageCostGBP: 60,
      currentValueGBP: 4000,
      totalCostGBP: 3000,
      unrealizedGainLoss: 1000,
      returnPct: 33.33
    }
  ],
  counts: {
    disposals: 1,
    dividends: 1,
    holdings: 2
  },
  showCgtWarning: true,
  portfolioAnalysis: {
    market_summaries: {
      GBP: {
        currency: 'GBP',
        total_market_value: 50000,
        total_unrealized_gain_loss: 5000,
        holdings: []
      }
    },
    total_portfolio_value: 50000,
    total_unrealized_gain_loss: 5000
  },
  taxAnalysis: {
    capital_gains_tax: 2000,
    dividend_tax: 500,
    total_tax_liability: 2500,
    section_104_pools: {},
    disposal_calculations: []
  },
  taxReport: {
    summary: {
      estimated_tax_liability: {
        total_estimated_tax: 2500,
        capital_gains_tax: 2000,
        dividend_tax: 500,
        currency_gains_tax: 0,
        section_104_pools: {}
      }
    }
  },
  portfolioReport: {
    grand_total: {
      total_value: 50000,
      total_return_pct: 10.5
    }
  }
};

const mockRawResults = {
  portfolio_analysis: {
    market_summaries: {
      GBP: {
        currency: 'GBP',
        total_market_value: 50000,
        total_unrealized_gain_loss: 5000,
        holdings: []
      }
    },
    total_portfolio_value: 50000,
    total_unrealized_gain_loss: 5000,
    total_unrealized_gain_loss_percent: 10.5
  },
  tax_analysis: {
    capital_gains: {
      disposals: [
        {
          disposal_date: '2024-04-05',
          security: { symbol: 'ABC' },
          quantity: 100,
          proceeds: 10000,
          cost_basis: 7500,
          gain_or_loss: 2500
        }
      ],
      section_104_pools: {}
    },
    dividend_income: {
      dividends: []
    }
  },
  tax_report: {
    summary: {
      estimated_tax_liability: {
        total_estimated_tax: 2500,
        capital_gains_tax: 2000,
        dividend_tax: 500,
        currency_gains_tax: 0,
        section_104_pools: {}
      }
    },
    dividend_income: {
      dividends: []
    }
  }
};

const mockSuccessState: CalculationState = {
  status: 'success',
  error: null,
  result: mockNormalizedResults,
  raw: mockRawResults
};

const mockIdleState: CalculationState = {
  status: 'idle',
  error: null,
  result: null,
  raw: null
};

const mockLoadingState: CalculationState = {
  status: 'submitting',
  error: null,
  result: null,
  raw: null
};

const mockErrorState: CalculationState = {
  status: 'error',
  error: 'Failed to process calculation',
  result: null,
  raw: null
};

const renderWithProvider = (initialState: CalculationState) =>
  render(
    <CalculationProvider initialState={initialState}>
      <ResultsPage />
    </CalculationProvider>
  );

describe('ResultsPage', () => {
  beforeEach(() => {
    delete (window as any).location;
    window.location = { hash: '', href: '' } as any;
    window.print = jest.fn();
    window.open = jest.fn();
  });

  it('renders loading state correctly', () => {
    renderWithProvider(mockLoadingState);

    expect(screen.getByText('Processing Your Tax Calculation')).toBeInTheDocument();
    expect(screen.getByText(/Please wait while we analyse/)).toBeInTheDocument();
  });

  it('renders error state correctly', async () => {
    const user = userEvent.setup();
    renderWithProvider(mockErrorState);

    expect(screen.getByText('Calculation Error')).toBeInTheDocument();
    expect(screen.getByText('Failed to process calculation')).toBeInTheDocument();

    const tryAgainButton = screen.getByRole('button', { name: /try again/i });
    await user.click(tryAgainButton);
    expect(window.location.hash).toBe('');
  });

  it('renders idle state correctly', async () => {
    const user = userEvent.setup();
    renderWithProvider(mockIdleState);

    expect(screen.getByText('No Calculation Results')).toBeInTheDocument();
    expect(screen.getByText(/Upload your brokerage files/)).toBeInTheDocument();

    const startButton = screen.getByRole('button', { name: /start tax calculation/i });
    await user.click(startButton);
    expect(window.location.hash).toBe('');
  });

  it('renders success state with all components', () => {
    renderWithProvider(mockSuccessState);

    expect(screen.getByText('Tax Calculation Results')).toBeInTheDocument();
    expect(screen.getByText(/Comprehensive analysis/)).toBeInTheDocument();
    expect(screen.getByText('Tax Liability Identified')).toBeInTheDocument();
    expect(screen.getByText(/£2,500.00/)).toBeInTheDocument();

    expect(screen.getByTestId('results-metrics')).toBeInTheDocument();
    expect(screen.getByTestId('portfolio-summary')).toHaveClass('shadow-sm', 'border-0');
    expect(screen.getByTestId('results-disposals')).toHaveClass('shadow-sm', 'border-0');
    expect(screen.getByTestId('results-dividends')).toHaveClass('shadow-sm', 'border-0');
    expect(screen.getByTestId('holdings-table')).toHaveClass('shadow-sm', 'border-0');
    expect(screen.getByTestId('tax-calculations')).toHaveClass('shadow-sm', 'border-0');
    expect(screen.getByTestId('data-visualization')).toBeInTheDocument();
    expect(screen.getByTestId('results-cta')).toBeInTheDocument();
  });

  it('does not show tax warning for zero tax liability', () => {
    const zeroTaxState: CalculationState = {
      status: 'success',
      error: null,
      result: {
        ...mockNormalizedResults,
        metrics: {
          ...mockNormalizedResults.metrics,
          totalTaxLiability: 0
        },
        showCgtWarning: false,
        taxAnalysis: {
          capital_gains_tax: 0,
          dividend_tax: 0,
          total_tax_liability: 0,
          section_104_pools: {},
          disposal_calculations: []
        },
        taxReport: {
          summary: {
            estimated_tax_liability: {
              total_estimated_tax: 0,
              capital_gains_tax: 0,
              dividend_tax: 0,
              currency_gains_tax: 0,
              section_104_pools: {}
            }
          }
        }
      },
      raw: {
        ...mockRawResults,
        tax_analysis: {
          capital_gains: {
            disposals: [],
            section_104_pools: {}
          },
          dividend_income: {
            dividends: []
          }
        },
        tax_report: {
          summary: {
            estimated_tax_liability: {
              total_estimated_tax: 0,
              capital_gains_tax: 0,
              dividend_tax: 0,
              currency_gains_tax: 0,
              section_104_pools: {}
            }
          },
          dividend_income: {
            dividends: []
          }
        }
      }
    };

    renderWithProvider(zeroTaxState);

    expect(screen.queryByText('Tax Liability Identified')).not.toBeInTheDocument();
  });

  it('handles missing data gracefully', () => {
    const incompleteDataState: CalculationState = {
      status: 'success',
      error: null,
      result: null,
      raw: {
        portfolio_analysis: null,
        tax_report: null
      }
    };

    renderWithProvider(incompleteDataState);

    expect(screen.getByText('Incomplete Data')).toBeInTheDocument();
    expect(
      screen.getByText(/calculation completed but some results data is missing/i)
    ).toBeInTheDocument();
  });

  it('handles header action buttons correctly', async () => {
    const user = userEvent.setup();
    renderWithProvider(mockSuccessState);

    const newCalcButtons = screen.getAllByRole('button', { name: /new calculation/i });
    await user.click(newCalcButtons[0]);
    expect(window.location.hash).toBe('');

    const printButton = screen.getByRole('button', { name: /print results/i });
    await user.click(printButton);
    expect(window.print).toHaveBeenCalled();
  });

  it('handles footer action buttons correctly', async () => {
    const user = userEvent.setup();
    renderWithProvider(mockSuccessState);

    const runNewButton = screen.getByRole('button', { name: /run new calculation/i });
    await user.click(runNewButton);
    expect(window.location.hash).toBe('');

    const homeButton = screen.getByRole('button', { name: /back to home/i });
    await user.click(homeButton);
    expect(window.location.href).toBe('/');

    const hmrcButton = screen.getByRole('button', { name: /hmrc guidance/i });
    await user.click(hmrcButton);
    expect(window.open).toHaveBeenCalledWith('https://www.gov.uk/capital-gains-tax', '_blank');
  });

  it('displays helpful footer information', () => {
    renderWithProvider(mockSuccessState);

    expect(screen.getByText('Need Help?')).toBeInTheDocument();
    expect(screen.getByText(/These calculations are estimates/)).toBeInTheDocument();
    expect(screen.getByText(/qualified accountant/)).toBeInTheDocument();
  });

  it('passes correct props to child components', () => {
    renderWithProvider(mockSuccessState);

    expect(screen.getByText('Portfolio Summary - Total: £50000')).toBeInTheDocument();
    expect(screen.getByText('Holdings Table - 2 holdings / 1 currencies')).toBeInTheDocument();
    expect(screen.getByText('Tax Calculations - Total Tax: £2500')).toBeInTheDocument();
    expect(
      screen.getByText('Data Visualization - Portfolio: £50000, Tax: £2500')
    ).toBeInTheDocument();
    expect(screen.getByText('Disposals Table - 1 rows')).toBeInTheDocument();
    expect(screen.getByText('Dividends Table - 1 rows')).toBeInTheDocument();
  });
});
