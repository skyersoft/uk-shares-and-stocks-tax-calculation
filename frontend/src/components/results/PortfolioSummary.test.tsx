import { render, screen } from '@testing-library/react';
import { PortfolioSummary } from './PortfolioSummary';
import { PortfolioAnalysis } from '../../types/calculation';

const mockPortfolioAnalysis: PortfolioAnalysis = {
  market_summaries: {
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
  },
  total_portfolio_value: 70000,
  total_unrealized_gain_loss: 7000,
  total_unrealized_gain_loss_percent: 10.77
};

describe('PortfolioSummary', () => {
  it('renders portfolio summary correctly', () => {
    render(<PortfolioSummary portfolioAnalysis={mockPortfolioAnalysis} />);
    
    // Check main title
    expect(screen.getByText('Portfolio Summary')).toBeInTheDocument();
    
    // Check total portfolio value
    expect(screen.getByText('Total Portfolio Value')).toBeInTheDocument();
    expect(screen.getByText('$70,000.00')).toBeInTheDocument();
    
    // Check total holdings count
    expect(screen.getByText('Total Holdings')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    
    // Check currencies
    expect(screen.getByText('Currencies')).toBeInTheDocument();
    expect(screen.getAllByText('USD')).toHaveLength(2); // One in currencies, one in breakdown
    expect(screen.getAllByText('GBP')).toHaveLength(2); // One in currencies, one in breakdown
  });

  it('displays unrealized gains correctly', () => {
    render(<PortfolioSummary portfolioAnalysis={mockPortfolioAnalysis} />);
    
    expect(screen.getByText('Unrealized Gain/Loss')).toBeInTheDocument();
    expect(screen.getByText('$7,000.00')).toBeInTheDocument();
    
    expect(screen.getByText('Unrealized Gain/Loss %')).toBeInTheDocument();
    // The percentage is calculated as gainLoss / costBasis
    // 7000 / (70000 - 7000) = 7000 / 63000 = 11.11%
    expect(screen.getByText('+11.11%')).toBeInTheDocument();
  });

  it('shows currency breakdown for multiple currencies', () => {
    render(<PortfolioSummary portfolioAnalysis={mockPortfolioAnalysis} />);
    
    expect(screen.getByText('Breakdown by Currency')).toBeInTheDocument();
    expect(screen.getByText('2 holdings')).toBeInTheDocument();
    expect(screen.getByText('1 holdings')).toBeInTheDocument();
  });

  it('does not show currency breakdown for single currency', () => {
    const singleCurrencyAnalysis: PortfolioAnalysis = {
      ...mockPortfolioAnalysis,
      market_summaries: {
        USD: mockPortfolioAnalysis.market_summaries.USD
      }
    };

    render(<PortfolioSummary portfolioAnalysis={singleCurrencyAnalysis} />);
    
    expect(screen.queryByText('Breakdown by Currency')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <PortfolioSummary 
        portfolioAnalysis={mockPortfolioAnalysis} 
        className="custom-class" 
      />
    );
    
    expect(container.firstChild).toHaveClass('portfolio-summary', 'custom-class');
  });
});