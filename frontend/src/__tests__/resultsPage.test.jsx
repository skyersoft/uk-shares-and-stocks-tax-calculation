import React from 'react';
import { render } from '@testing-library/react';
import ResultsPage from '../pages/ResultsPage';
import { CalculationProvider } from '../context/CalculationContext';

describe('ResultsPage', () => {
  test('shows placeholder when no results yet', () => {
    const { getByText } = render(<CalculationProvider><ResultsPage /></CalculationProvider>);
    expect(getByText(/No results yet/i)).toBeInTheDocument();
  });

  test('renders holdings count when success state present', () => {
    const mockState = {
      status: 'success',
      error: null,
      result: {},
      raw: {
        portfolio_analysis: {
          market_summaries: {
            DEFAULT: {
              holdings: [
                {
                  id: 'H1',
                  security: { symbol: 'AAPL' },
                  quantity: 10,
                  average_cost_gbp: 100,
                  current_value_gbp: 150,
                  unrealized_gain_loss: 50,
                  total_return_pct: 50
                }
              ]
            }
          }
        }
      }
    };
    const { getByText, queryByText } = render(<CalculationProvider initialState={mockState}><ResultsPage /></CalculationProvider>);
    expect(queryByText(/No results yet/i)).toBeNull();
    expect(getByText(/Holdings: 1/)).toBeInTheDocument();
    expect(getByText('AAPL')).toBeInTheDocument();
  });
});
