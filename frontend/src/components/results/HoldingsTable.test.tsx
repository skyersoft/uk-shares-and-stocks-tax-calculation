import { render, screen } from '@testing-library/react';
import { ResultsHoldingsTable } from './HoldingsTable';
import { MarketSummary } from '../../types/calculation';

const mockMarketSummaries: Record<string, MarketSummary> = {
  USD: {
    currency: 'USD',
    total_market_value: 50000,
    total_unrealized_gain_loss: 5000,
    total_unrealized_gain_loss_percent: 10.5,
    holdings: [
      {
        symbol: 'AAPL',
        quantity: 100,
        price: 150,
        market_value: 15000,
        average_cost: 140,
        unrealized_gain_loss: 1000,
        unrealized_gain_loss_percent: 7.14
      },
      {
        symbol: 'MSFT',
        quantity: 50,
        price: 300,
        market_value: 15000,
        average_cost: 280,
        unrealized_gain_loss: 1000,
        unrealized_gain_loss_percent: 7.14
      }
    ]
  },
  GBP: {
    currency: 'GBP',
    total_market_value: 20000,
    total_unrealized_gain_loss: 2000,
    total_unrealized_gain_loss_percent: 11.11,
    holdings: [
      {
        symbol: 'VOO',
        quantity: 25,
        price: 400,
        market_value: 10000,
        average_cost: 350,
        unrealized_gain_loss: 1250,
        unrealized_gain_loss_percent: 14.29
      }
    ]
  }
};

describe('ResultsHoldingsTable', () => {
  it('renders holdings table with data', () => {
    render(<ResultsHoldingsTable marketSummaries={mockMarketSummaries} />);
    
    // Check title
    expect(screen.getByText('Holdings Details')).toBeInTheDocument();
    
    // Check summary values
    expect(screen.getByText(/Total Value:/)).toBeInTheDocument();
    expect(screen.getByText(/Total P&L:/)).toBeInTheDocument();
    
    // Check that table headers are present
    expect(screen.getByText('Symbol')).toBeInTheDocument();
    expect(screen.getByText('Security')).toBeInTheDocument();
    expect(screen.getByText('Quantity')).toBeInTheDocument();
    expect(screen.getByText('Avg Cost')).toBeInTheDocument();
    expect(screen.getByText('Current Value')).toBeInTheDocument();
    expect(screen.getByText('Gain/Loss')).toBeInTheDocument();
  });

  it('displays holding symbols correctly', () => {
    render(<ResultsHoldingsTable marketSummaries={mockMarketSummaries} />);
    
    // Each symbol appears twice (symbol column and security column)
    expect(screen.getAllByText('AAPL')).toHaveLength(2);
    expect(screen.getAllByText('MSFT')).toHaveLength(2);
    expect(screen.getAllByText('VOO')).toHaveLength(2);
  });

  it('handles empty holdings', () => {
    const emptyMarketSummaries: Record<string, MarketSummary> = {
      USD: {
        currency: 'USD',
        total_market_value: 0,
        total_unrealized_gain_loss: 0,
        total_unrealized_gain_loss_percent: 0,
        holdings: []
      }
    };

    render(<ResultsHoldingsTable marketSummaries={emptyMarketSummaries} />);
    
    expect(screen.getByText('Holdings Details')).toBeInTheDocument();
    expect(screen.getByText('No holdings found')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <ResultsHoldingsTable 
        marketSummaries={mockMarketSummaries} 
        className="custom-class" 
      />
    );
    
    expect(container.firstChild).toHaveClass('holdings-table-card', 'custom-class');
  });

  it('calculates and displays total values correctly', () => {
    render(<ResultsHoldingsTable marketSummaries={mockMarketSummaries} />);
    
    // Total value should be sum of all market_value: 15000 + 15000 + 10000 = 40000
    expect(screen.getByText(/£40,000.00/)).toBeInTheDocument();
    
    // Total P&L should be sum of all unrealized_gain_loss: 1000 + 1000 + 1250 = 3250
    expect(screen.getByText(/£3,250.00/)).toBeInTheDocument();
  });
});