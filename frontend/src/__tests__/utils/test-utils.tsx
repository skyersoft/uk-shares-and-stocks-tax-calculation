import React from 'react';
import { render, RenderResult } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { configureAxe, toHaveNoViolations } from 'jest-axe';
// import { ToastProvider } from '../../components/ui/ToastContext';
import { CalculationProvider } from '../../context/CalculationContext';

// Extend jest matchers for accessibility testing
expect.extend(toHaveNoViolations);

// Configure axe for accessibility testing
const axe = configureAxe({
  rules: {
    // Disable color-contrast rule as it might be flaky in test environment
    'color-contrast': { enabled: false },
  },
});

// Error boundary for test debugging
class TestErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Test Error Boundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div data-testid="error-boundary">Test Error: {this.state.error?.message}</div>;
    }
    return this.props.children;
  }
}

// Test providers wrapper
const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <TestErrorBoundary>
      <CalculationProvider>
        {children}
      </CalculationProvider>
    </TestErrorBoundary>
  );
};

/**
 * Custom render function for testing components with providers
 * Returns render result along with a user event instance
 */
export const renderWithProviders = (ui: React.ReactElement, options = {}) => {
  const result = render(ui, {
    wrapper: AllTheProviders,
    ...options,
  });
  
  return {
    ...result,
    user: userEvent.setup(),
  };
};

/**
 * Test accessibility of a component
 * @param container - The container element to test
 */
export const testAccessibility = async (container: HTMLElement) => {
  const results = await axe(container);
  expect(results).toHaveNoViolations();
};

/**
 * Create a mock file for testing file uploads
 */
export const createMockFile = (
  name = 'test.csv',
  type = 'text/csv',
  size = 1024,
  content = 'test,data\n1,2'
) => {
  const file = new File([content], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

/**
 * Mock financial data for testing
 */
export const mockTransactionData = {
  simple: [
    {
      id: '1',
      date: '2024-01-15',
      symbol: 'AAPL',
      action: 'BUY',
      quantity: 100,
      price: 185.50,
      currency: 'USD',
      commission: 1.00
    },
    {
      id: '2', 
      date: '2024-03-20',
      symbol: 'AAPL',
      action: 'SELL',
      quantity: 50,
      price: 190.25,
      currency: 'USD',
      commission: 1.00
    }
  ],
  complex: [
    // Add more complex test data as needed
  ]
};

/**
 * Mock calculation results for testing
 */
export const mockCalculationResults = {
  totalGain: 237.50,
  totalLoss: 0,
  netGain: 237.50,
  taxableGain: 237.50,
  annualExemption: 6000,
  taxDue: 0,
  effectiveRate: 0,
  holdings: [
    {
      symbol: 'AAPL',
      totalGain: 237.50,
      realizedGain: 237.50,
      unrealizedGain: 0,
      currentValue: 9262.50
    }
  ]
};

// Re-export everything from testing-library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';

// Basic test to ensure this file doesn't fail
describe('Test Utils', () => {
  test('should export render function', () => {
    expect(render).toBeDefined();
  });
  
  test('should export userEvent', () => {
    expect(userEvent).toBeDefined();
  });
});