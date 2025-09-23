import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ResultsPage from './ResultsPage';
import { CalculationProvider } from '../context/CalculationContext';

// Define the state interface locally for testing
interface CalculationState {
  status: 'idle' | 'submitting' | 'success' | 'error';
  error: string | null;
  result: any | null;
  raw: any | null;
}

// Mock the results components
jest.mock('../components/results/PortfolioSummary', () => ({
  PortfolioSummary: ({ portfolioAnalysis, className }: any) => (
    <div data-testid="portfolio-summary" className={className}>
      Portfolio Summary - Total: ${portfolioAnalysis.total_portfolio_value}
    </div>
  )
}));

jest.mock('../components/results/HoldingsTable', () => ({
  ResultsHoldingsTable: ({ marketSummaries, className }: any) => (
    <div data-testid="holdings-table" className={className}>
      Holdings Table - {Object.keys(marketSummaries).length} currencies
    </div>  
  )
}));

jest.mock('../components/results/TaxCalculations', () => ({
  TaxCalculations: ({ taxCalculations, className }: any) => (
    <div data-testid="tax-calculations" className={className}>
      Tax Calculations - Total Tax: £{taxCalculations.total_tax_liability}
    </div>
  )
}));

jest.mock('../components/results/DataVisualization', () => ({
  __esModule: true,
  default: ({ portfolioAnalysis, taxCalculations }: any) => (
    <div data-testid="data-visualization">
      Data Visualization - Portfolio: ${portfolioAnalysis.total_portfolio_value}, Tax: £{taxCalculations.total_tax_liability}
    </div>
  )
}));

const mockSuccessState: CalculationState = {
  status: 'success',
  error: null,
  result: {},
  raw: {
    portfolio_analysis: {
      market_summaries: {
        USD: {
          currency: 'USD',
          total_market_value: 50000,
          total_unrealized_gain_loss: 5000,
          total_unrealized_gain_loss_percent: 10.5,
          holdings: []
        }
      },
      total_portfolio_value: 50000,
      total_unrealized_gain_loss: 5000,
      total_unrealized_gain_loss_percent: 10.5
    },
    tax_analysis: {
      capital_gains_tax: 2000,
      dividend_tax: 500,
      total_tax_liability: 2500,
      section_104_pools: {},
      disposal_calculations: []
    }
  }
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

const renderWithProvider = (initialState: CalculationState) => {
  return render(
    <CalculationProvider initialState={initialState}>
      <ResultsPage />
    </CalculationProvider>
  );
};

describe('ResultsPage', () => {
  beforeEach(() => {
    // Mock window.location
    delete (window as any).location;
    window.location = { hash: '', href: '' } as any;
    
    // Mock window.print
    window.print = jest.fn();
    
    // Mock window.open
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
    expect(tryAgainButton).toBeInTheDocument();
    
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
    
    // Check page header
    expect(screen.getByText('Tax Calculation Results')).toBeInTheDocument();
    expect(screen.getByText(/Comprehensive analysis/)).toBeInTheDocument();
    
    // Check tax liability warning
    expect(screen.getByText('Tax Liability Identified')).toBeInTheDocument();
    expect(screen.getByText(/£2,500.00/)).toBeInTheDocument();
    
    // Check components are rendered
    expect(screen.getByTestId('portfolio-summary')).toBeInTheDocument();
    expect(screen.getByTestId('holdings-table')).toBeInTheDocument();
    expect(screen.getByTestId('tax-calculations')).toBeInTheDocument();
    expect(screen.getByTestId('data-visualization')).toBeInTheDocument();
    
    // Check components have shadow styling
    expect(screen.getByTestId('portfolio-summary')).toHaveClass('shadow-sm', 'border-0');
    expect(screen.getByTestId('holdings-table')).toHaveClass('shadow-sm', 'border-0');
    expect(screen.getByTestId('tax-calculations')).toHaveClass('shadow-sm', 'border-0');
    
    // Check Portfolio Analytics section
    expect(screen.getByText('Portfolio Analytics')).toBeInTheDocument();
    expect(screen.getByText(/Interactive charts and visualizations/)).toBeInTheDocument();
  });

  it('does not show tax warning for zero tax liability', () => {
    const zeroTaxState = {
      ...mockSuccessState,
      raw: {
        ...mockSuccessState.raw,
        tax_analysis: {
          ...mockSuccessState.raw!.tax_analysis,
          total_tax_liability: 0
        }
      }
    };
    
    renderWithProvider(zeroTaxState);
    
    expect(screen.queryByText('Tax Liability Identified')).not.toBeInTheDocument();
  });

  it('handles missing data gracefully', () => {
    const incompleteDataState = {
      ...mockSuccessState,
      raw: {
        portfolio_analysis: null,
        tax_analysis: null
      }
    };
    
    renderWithProvider(incompleteDataState);
    
    expect(screen.getByText('Incomplete Data')).toBeInTheDocument();
    expect(screen.getByText(/calculation completed but some results data is missing/)).toBeInTheDocument();
  });

  it('handles header action buttons correctly', async () => {
    const user = userEvent.setup();
    renderWithProvider(mockSuccessState);
    
    // Test New Calculation button in header (first one)
    const newCalcButtons = screen.getAllByRole('button', { name: /new calculation/i });
    await user.click(newCalcButtons[0]); // Click the first one (header)
    expect(window.location.hash).toBe('');
    
    // Test Print button
    const printButton = screen.getByRole('button', { name: /print results/i });
    await user.click(printButton);
    expect(window.print).toHaveBeenCalled();
  });

  it('handles footer action buttons correctly', async () => {
    const user = userEvent.setup();
    renderWithProvider(mockSuccessState);
    
    // Test Run New Calculation button
    const runNewButton = screen.getByRole('button', { name: /run new calculation/i });
    await user.click(runNewButton);
    expect(window.location.hash).toBe('');
    
    // Test Back to Home button
    const homeButton = screen.getByRole('button', { name: /back to home/i });
    await user.click(homeButton);
    expect(window.location.href).toBe('/');
    
    // Test HMRC Guidance button
    const hmrcButton = screen.getByRole('button', { name: /hmrc guidance/i });
    await user.click(hmrcButton);
    expect(window.open).toHaveBeenCalledWith('https://www.gov.uk/capital-gains-tax', '_blank');
  });

  it('displays helpful footer information', () => {
    renderWithProvider(mockSuccessState);
    
    expect(screen.getByText('Need Help?')).toBeInTheDocument();
    expect(screen.getByText(/These calculations are estimates/)).toBeInTheDocument();
    expect(screen.getByText(/consult with a qualified accountant/)).toBeInTheDocument();
  });

  it('passes correct props to child components', () => {
    renderWithProvider(mockSuccessState);
    
    // Check that components receive the right data
    expect(screen.getByText('Portfolio Summary - Total: $50000')).toBeInTheDocument();
    expect(screen.getByText('Holdings Table - 1 currencies')).toBeInTheDocument();
    expect(screen.getByText('Tax Calculations - Total Tax: £2500')).toBeInTheDocument();
    expect(screen.getByText('Data Visualization - Portfolio: $50000, Tax: £2500')).toBeInTheDocument();
  });
});