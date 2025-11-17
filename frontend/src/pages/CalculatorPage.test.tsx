import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../__tests__/utils/test-utils';
import '@testing-library/jest-dom';
import CalculatorPage from './CalculatorPage';
import { submitCalculation } from '../services/api';

// Mock API calls and services
jest.mock('../services/api', () => ({
  submitCalculation: jest.fn(),
}));

const mockSubmitCalculation = submitCalculation as jest.MockedFunction<typeof submitCalculation>;

// Mock CalculationContext
const mockDispatch = jest.fn();
let mockState: any = { status: 'idle', error: null, result: null };

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

// Helper function to simulate file upload
const simulateFileUpload = (fileInput: HTMLInputElement, file: File) => {
  Object.defineProperty(fileInput, 'files', {
    value: [file],
    writable: false,
  });
  fireEvent.change(fileInput);
};

describe('CalculatorPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockState = { status: 'idle', error: null, result: null };
  });

  describe('Basic Rendering', () => {
    it('renders calculator page with main heading', () => {
      renderWithProviders(<CalculatorPage />);
      
      expect(screen.getByRole('heading', { name: /UK Tax Calculator/i })).toBeInTheDocument();
      expect(screen.getByText(/Calculate your Capital Gains Tax for informational purposes/i)).toBeInTheDocument();
    });

    it('renders file upload component', () => {
      renderWithProviders(<CalculatorPage />);
      
      // File input is created dynamically on click, check for upload area
      expect(screen.getByText(/Choose File to Upload/i)).toBeInTheDocument();
      expect(screen.getByText(/CSV or QFX files/i)).toBeInTheDocument();
    });

    it('renders form controls', () => {
      renderWithProviders(<CalculatorPage />);
      
      // Tax year dropdown
      expect(screen.getByText(/Tax Year/)).toBeInTheDocument();
      
      // Analysis type dropdown
      expect(screen.getByText(/Analysis Type/)).toBeInTheDocument();
      
      // Submit button
      const submitButton = screen.getByRole('button', { name: /calculate/i });
      expect(submitButton).toBeInTheDocument();
    });
  });
});