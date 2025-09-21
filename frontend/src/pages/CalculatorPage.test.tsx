import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../__tests__/utils/test-utils';
import '@testing-library/jest-dom';
import CalculatorPage from './CalculatorPage';

// Mock API calls and services
jest.mock('../services/api', () => ({
  submitCalculation: jest.fn(),
}));

// Mock CalculationContext
const mockDispatch = jest.fn();
const mockState = { status: 'idle', error: null, result: null };

jest.mock('../context/CalculationContext', () => ({
  __esModule: true,
  useCalculation: () => ({
    state: mockState,
    dispatch: mockDispatch,
  }),
  CalculationProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-calculation-provider">{children}</div>
  ),
}));

describe('CalculatorPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders calculator page with main heading', () => {
      renderWithProviders(<CalculatorPage />);
      
      expect(screen.getByRole('heading', { name: /🧮 UK Tax Calculator/i })).toBeInTheDocument();
      expect(screen.getByText(/Calculate your UK Capital Gains Tax and analyze your portfolio/i)).toBeInTheDocument();
    });

    it('renders file input with correct attributes', () => {
      const { container } = renderWithProviders(<CalculatorPage />);
      
      const fileInput = container.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveAttribute('accept', '.csv,.qfx,.ofx');
      expect(fileInput).toHaveAttribute('type', 'file');
    });

    it('renders submit button', () => {
      renderWithProviders(<CalculatorPage />);
      
      const submitButton = screen.getByRole('button', { name: /calculate tax & portfolio/i });
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).toBeDisabled(); // Initially disabled when no file
    });

    it('shows enhanced page features', () => {
      renderWithProviders(<CalculatorPage />);
      
      expect(screen.getByText(/Why Choose Our Tax Calculator?/i)).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /HMRC Compliant/i })).toBeInTheDocument();
      expect(screen.getByText(/Frequently Asked Questions/i)).toBeInTheDocument();
    });
  });
});