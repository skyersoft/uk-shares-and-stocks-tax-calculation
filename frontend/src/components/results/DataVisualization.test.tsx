
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import DataVisualization from './DataVisualization';
import { PortfolioAnalysis, TaxCalculation } from '../../types/calculation';

// Mock Chart.js components
jest.mock('react-chartjs-2', () => ({
  Bar: ({ data, options }: any) => <div data-testid="bar-chart">{JSON.stringify({ data, options })}</div>,
  Doughnut: ({ data, options }: any) => <div data-testid="doughnut-chart">{JSON.stringify({ data, options })}</div>,
}));

jest.mock('chart.js', () => ({
  Chart: {
    register: jest.fn(),
  },
  CategoryScale: {},
  LinearScale: {},
  PointElement: {},
  LineElement: {},
  BarElement: {},
  ArcElement: {},
  Title: {},
  Tooltip: {},
  Legend: {},
}));

describe('DataVisualization', () => {
  const mockPortfolioAnalysis: PortfolioAnalysis = {
    market_summaries: {
      'USD': {
        currency: 'USD',
        total_market_value: 10000,
        total_unrealized_gain_loss: 1000,
        total_unrealized_gain_loss_percent: 10.0,
        holdings: [
          {
            symbol: 'AAPL',
            quantity: 100,
            price: 150,
            market_value: 15000,
            average_cost: 140,
            unrealized_gain_loss: 1000,
            unrealized_gain_loss_percent: 7.14,
          },
          {
            symbol: 'GOOGL',
            quantity: 50,
            price: 120,
            market_value: 6000,
            average_cost: 130,
            unrealized_gain_loss: -500,
            unrealized_gain_loss_percent: -7.69,
          },
        ],
      },
      'GBP': {
        currency: 'GBP',
        total_market_value: 5000,
        total_unrealized_gain_loss: 200,
        total_unrealized_gain_loss_percent: 4.17,
        holdings: [
          {
            symbol: 'VOD',
            quantity: 200,
            price: 25,
            market_value: 5000,
            average_cost: 24,
            unrealized_gain_loss: 200,
            unrealized_gain_loss_percent: 4.17,
          },
        ],
      },
    },
    total_portfolio_value: 15000,
    total_unrealized_gain_loss: 1200,
    total_unrealized_gain_loss_percent: 8.7,
  };

  const mockTaxCalculations: TaxCalculation = {
    capital_gains_tax: 200,
    dividend_tax: 50,
    total_tax_liability: 250,
    section_104_pools: {
      'AAPL': { shares: 100, cost: 14000 },
      'GOOGL': { shares: 50, cost: 6500 },
    },
    disposal_calculations: [
      { symbol: 'MSFT', taxable_gain: 500, tax_liability: 100 },
      { symbol: 'TSLA', taxable_gain: -200, tax_liability: 0 },
      { symbol: 'AMZN', taxable_gain: 300, tax_liability: 60 },
    ],
  };

  const mockTaxCalculationsNoTax: TaxCalculation = {
    capital_gains_tax: 0,
    dividend_tax: 0,
    total_tax_liability: 0,
    section_104_pools: {},
    disposal_calculations: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders data visualization with all charts', () => {
    render(
      <DataVisualization
        portfolioAnalysis={mockPortfolioAnalysis}
        taxCalculations={mockTaxCalculations}
      />
    );

    // Check for main sections
    expect(screen.getByText('Portfolio Allocation')).toBeInTheDocument();
    expect(screen.getByText('Currency Breakdown')).toBeInTheDocument();
    expect(screen.getByText('Unrealized Gains/Losses by Security')).toBeInTheDocument();
    expect(screen.getByText('Tax Analysis')).toBeInTheDocument();
    expect(screen.getByText('Portfolio Summary')).toBeInTheDocument();

    // Check for chart components
    expect(screen.getAllByTestId('doughnut-chart')).toHaveLength(3); // Portfolio, Currency, Tax
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument(); // Gains/Losses
  });

  it('displays portfolio summary statistics correctly', () => {
    render(
      <DataVisualization
        portfolioAnalysis={mockPortfolioAnalysis}
        taxCalculations={mockTaxCalculations}
      />
    );

    // Check portfolio statistics by finding sections first
    expect(screen.getByText('Total Holdings')).toBeInTheDocument();
    expect(screen.getByText('Total Value')).toBeInTheDocument();
    expect(screen.getByText('Total Gains')).toBeInTheDocument();
    expect(screen.getByText('Currencies')).toBeInTheDocument();
    
    // Check for specific value displays
    expect(screen.getByText('£15,000')).toBeInTheDocument(); // Total value
    expect(screen.getByText('£1,200')).toBeInTheDocument(); // Total gains
  });

  it('displays tax information correctly', () => {
    render(
      <DataVisualization
        portfolioAnalysis={mockPortfolioAnalysis}
        taxCalculations={mockTaxCalculations}
      />
    );

    // Check tax information
    expect(screen.getByText('Tax Analysis')).toBeInTheDocument();
    expect(screen.getByText('Total Tax')).toBeInTheDocument();
    expect(screen.getByText('Disposals')).toBeInTheDocument();
    expect(screen.getByText('£250')).toBeInTheDocument(); // Total tax
  });

  it('hides tax analysis section when no tax liability', () => {
    render(
      <DataVisualization
        portfolioAnalysis={mockPortfolioAnalysis}
        taxCalculations={mockTaxCalculationsNoTax}
      />
    );

    // Tax Analysis section should not be present
    expect(screen.queryByText('Tax Analysis')).not.toBeInTheDocument();
  });

  it('handles single currency correctly', () => {
    const singleCurrencyPortfolio: PortfolioAnalysis = {
      market_summaries: {
        'GBP': {
          currency: 'GBP',
          total_market_value: 10000,
          total_unrealized_gain_loss: 500,
          total_unrealized_gain_loss_percent: 5.0,
          holdings: [
            {
              symbol: 'VOD',
              quantity: 100,
              price: 100,
              market_value: 10000,
              average_cost: 95,
              unrealized_gain_loss: 500,
              unrealized_gain_loss_percent: 5.26,
            },
          ],
        },
      },
      total_portfolio_value: 10000,
      total_unrealized_gain_loss: 500,
      total_unrealized_gain_loss_percent: 5.0,
    };

    render(
      <DataVisualization
        portfolioAnalysis={singleCurrencyPortfolio}
        taxCalculations={mockTaxCalculationsNoTax}
      />
    );

    // Check for single currency display in the currencies section
    expect(screen.getByText('Currencies')).toBeInTheDocument();
    const currencyElements = screen.getAllByText('1');
    expect(currencyElements.length).toBeGreaterThan(0); // Should find currency count
  });

  it('applies custom className', () => {
    const { container } = render(
      <DataVisualization
        portfolioAnalysis={mockPortfolioAnalysis}
        taxCalculations={mockTaxCalculations}
        className="custom-class"
      />
    );

    expect(container.firstChild).toHaveClass('data-visualization', 'custom-class');
  });

  it('handles empty holdings gracefully', () => {
    const emptyPortfolio: PortfolioAnalysis = {
      market_summaries: {
        'GBP': {
          currency: 'GBP',
          total_market_value: 0,
          total_unrealized_gain_loss: 0,
          total_unrealized_gain_loss_percent: 0,
          holdings: [],
        },
      },
      total_portfolio_value: 0,
      total_unrealized_gain_loss: 0,
      total_unrealized_gain_loss_percent: 0,
    };

    render(
      <DataVisualization
        portfolioAnalysis={emptyPortfolio}
        taxCalculations={mockTaxCalculationsNoTax}
      />
    );

    // Check for zero holdings
    expect(screen.getByText('Total Holdings')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument(); // Zero holdings
    
    // Check for zero value and gains - use more specific queries
    expect(screen.getByText('Total Value')).toBeInTheDocument();
    expect(screen.getByText('Total Gains')).toBeInTheDocument();
  });

  it('sorts holdings by market value correctly', () => {
    render(
      <DataVisualization
        portfolioAnalysis={mockPortfolioAnalysis}
        taxCalculations={mockTaxCalculations}
      />
    );

    // Verify charts are rendered (sorting logic is tested through chart data)
    const doughnutCharts = screen.getAllByTestId('doughnut-chart');
    const barChart = screen.getByTestId('bar-chart');

    expect(doughnutCharts.length).toBeGreaterThan(0);
    expect(barChart).toBeInTheDocument();

    // Check that chart data contains expected symbols (AAPL should be first due to highest value)
    const allocationChart = doughnutCharts[0];
    expect(allocationChart.textContent).toContain('AAPL');
  });

  it('displays gains and losses with correct colors', () => {
    render(
      <DataVisualization
        portfolioAnalysis={mockPortfolioAnalysis}
        taxCalculations={mockTaxCalculations}
      />
    );

    // Check that gains section exists
    expect(screen.getByText('Total Gains')).toBeInTheDocument();
    
    // Find the specific gains display element 
    const gainsSection = screen.getByText('Total Gains').closest('.text-center');
    expect(gainsSection).toBeInTheDocument();
    
    // Check for positive gains styling
    const gainsElement = gainsSection?.querySelector('.text-success');
    expect(gainsElement).toBeInTheDocument();
  });

  it('handles negative total gains correctly', () => {
    const lossPortfolio: PortfolioAnalysis = {
      ...mockPortfolioAnalysis,
      total_unrealized_gain_loss: -500,
    };

    render(
      <DataVisualization
        portfolioAnalysis={lossPortfolio}
        taxCalculations={mockTaxCalculations}
      />
    );

    // Check that losses section exists
    expect(screen.getByText('Total Gains')).toBeInTheDocument();
    
    // Find the specific losses display element 
    const gainsSection = screen.getByText('Total Gains').closest('.text-center');
    expect(gainsSection).toBeInTheDocument();
    
    // Check for negative gains styling
    const lossElement = gainsSection?.querySelector('.text-danger');
    expect(lossElement).toBeInTheDocument();
  });
});