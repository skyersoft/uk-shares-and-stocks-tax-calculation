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
      
      expect(screen.getByRole('heading', { name: /🧮 UK Tax Calculator/i })).toBeInTheDocument();
      expect(screen.getByText(/Calculate your UK Capital Gains Tax and analyze your portfolio/i)).toBeInTheDocument();
    });

    it('renders file upload component', () => {
      const { container } = renderWithProviders(<CalculatorPage />);
      
      const fileInput = container.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveAttribute('accept', '.csv,.qfx,.ofx');
    });

    it('renders form controls', () => {
      renderWithProviders(<CalculatorPage />);
      
      // Tax year dropdown
      expect(screen.getByText(/Tax Year/)).toBeInTheDocument();
      expect(screen.getByDisplayValue('2024-2025')).toBeInTheDocument();
      
      // Analysis type dropdown
      expect(screen.getByText(/Analysis Type/)).toBeInTheDocument();
      expect(screen.getByDisplayValue('Tax & Portfolio Analysis')).toBeInTheDocument();
      
      // Submit button
      const submitButton = screen.getByRole('button', { name: /calculate tax & portfolio/i });
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).toBeDisabled(); // Initially disabled when no file
    });

    it('shows feature highlights', () => {
      renderWithProviders(<CalculatorPage />);
      
      expect(screen.getByText(/Why Choose Our Tax Calculator?/i)).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /HMRC Compliant/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /Portfolio Analytics/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /Secure & Private/i })).toBeInTheDocument();
    });

    it('shows FAQ section', () => {
      renderWithProviders(<CalculatorPage />);
      
      expect(screen.getByText(/Frequently Asked Questions/i)).toBeInTheDocument();
      expect(screen.getByText(/What file formats does the calculator accept?/i)).toBeInTheDocument();
    });

    it('shows testimonials section', () => {
      renderWithProviders(<CalculatorPage />);
      
      expect(screen.getByText(/Trusted by UK Investors/i)).toBeInTheDocument();
      expect(screen.getByText(/James M./i)).toBeInTheDocument();
      expect(screen.getByText(/Sarah C./i)).toBeInTheDocument();
    });
  });

  describe('File Upload Integration', () => {
    it('enables submit button when valid file is selected', async () => {
      const { container } = renderWithProviders(<CalculatorPage />);
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      const submitButton = screen.getByRole('button', { name: /calculate tax & portfolio/i });
      
      expect(submitButton).toBeDisabled();
      
      // Upload a valid file
      const validFile = new File(['test content'], 'test.csv', { type: 'text/csv' });
      simulateFileUpload(fileInput, validFile);
      
      // Wait for FileUpload component to process the file
      await waitFor(() => {
        expect(screen.getByText('Selected:')).toBeInTheDocument();
        expect(screen.getByText((content) => content.includes('test.csv'))).toBeInTheDocument();
      }, { timeout: 3000 });
      
      expect(submitButton).not.toBeDisabled();
    });

    it('shows file selection info when file is uploaded', async () => {
      const { container } = renderWithProviders(<CalculatorPage />);
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      
      const validFile = new File(['test content'], 'portfolio.csv', { type: 'text/csv' });
      simulateFileUpload(fileInput, validFile);
      
      await waitFor(() => {
        expect(screen.getByText('Selected:')).toBeInTheDocument();
        expect(screen.getByText((content) => content.includes('portfolio.csv'))).toBeInTheDocument();
        expect(screen.getByText(/KB/)).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('Form Validation', () => {
    it('shows validation errors when form is submitted without file', async () => {
      const { container } = renderWithProviders(<CalculatorPage />);
      const form = container.querySelector('form');
      
      fireEvent.submit(form!);
      
      // Should not call API without valid file
      expect(mockSubmitCalculation).not.toHaveBeenCalled();
      expect(mockDispatch).not.toHaveBeenCalledWith({ type: 'SUBMIT_START' });
    });

    it('validates tax year selection', () => {
      renderWithProviders(<CalculatorPage />);
      
      const taxYearSelect = screen.getByDisplayValue('2024-2025');
      expect(taxYearSelect).toBeInTheDocument();
      
      fireEvent.change(taxYearSelect, { target: { value: '2023-2024' } });
      expect(screen.getByDisplayValue('2023-2024')).toBeInTheDocument();
    });

    it('validates analysis type selection', () => {
      renderWithProviders(<CalculatorPage />);
      
      const analysisTypeSelect = screen.getByLabelText(/Analysis Type/);
      expect(analysisTypeSelect).toBeInTheDocument();
      expect(analysisTypeSelect).toHaveValue('both');
      
      fireEvent.change(analysisTypeSelect, { target: { value: 'tax' } });
      expect(analysisTypeSelect).toHaveValue('tax');
    });
  });

  describe('Form Submission', () => {
    beforeEach(() => {
      mockSubmitCalculation.mockResolvedValue({
        raw: {
          portfolio_summary: { total_value: 100000 },
          disposals: [],
          dividends: []
        }
      });
    });

    it('submits form with valid data', async () => {
      const { container } = renderWithProviders(<CalculatorPage />);
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      const form = container.querySelector('form');
      
      // Upload valid file first
      const validFile = new File(['test content'], 'test.csv', { type: 'text/csv' });
      simulateFileUpload(fileInput, validFile);
      
      await waitFor(() => {
        expect(screen.getByText('Selected:')).toBeInTheDocument();
        expect(screen.getByText((content) => content.includes('test.csv'))).toBeInTheDocument();
      }, { timeout: 3000 });
      
      // Submit form
      fireEvent.submit(form!);
      
      expect(mockDispatch).toHaveBeenCalledWith({ type: 'SUBMIT_START' });
      
      await waitFor(() => {
        expect(mockSubmitCalculation).toHaveBeenCalledWith({
          file: validFile,
          taxYear: '2024-2025',
          analysisType: 'both'
        });
      });
    });

    it('shows loading state during submission', async () => {
      mockState = { status: 'submitting', error: null, result: null };
      
      renderWithProviders(<CalculatorPage />);
      
      expect(screen.getByText(/Processing your portfolio data.../)).toBeInTheDocument();
      expect(screen.getByText(/This may take a few moments for large files/)).toBeInTheDocument();
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument(); // LoadingSpinner
    });

    it('disables form controls during submission', () => {
      mockState = { status: 'submitting', error: null, result: null };
      
      const { container } = renderWithProviders(<CalculatorPage />);
      
      const submitButton = screen.getByRole('button', { name: '' });
      expect(submitButton).toBeDisabled();
      expect(submitButton).toHaveAttribute('aria-busy', 'true');
      
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput).toBeDisabled();
      
      const taxYearSelect = screen.getByDisplayValue('2024-2025');
      expect(taxYearSelect).toBeDisabled();
      
      const analysisTypeSelect = screen.getByDisplayValue('Tax & Portfolio Analysis');
      expect(analysisTypeSelect).toBeDisabled();
    });
  });

  describe('Success State', () => {
    it('shows success message when calculation completes', () => {
      mockState = { status: 'success', error: null, result: { raw: {} } };
      
      renderWithProviders(<CalculatorPage />);
      
      expect(screen.getByText(/Calculation Complete!/)).toBeInTheDocument();
      expect(screen.getByText(/Your tax calculation has been completed successfully/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /📊 View Results/i })).toBeInTheDocument();
    });

    it('provides link to results page on success', () => {
      mockState = { status: 'success', error: null, result: { raw: {} } };
      
      // Mock window.location.hash
      delete (window as any).location;
      (window as any).location = { hash: '' };
      
      renderWithProviders(<CalculatorPage />);
      
      const viewResultsButton = screen.getByRole('button', { name: /📊 View Results/i });
      fireEvent.click(viewResultsButton);
      
      expect(window.location.hash).toBe('#results');
    });
  });

  describe('Error Handling', () => {
    it('displays error message when calculation fails', () => {
      mockState = { status: 'error', error: 'Invalid file format', result: null };
      
      renderWithProviders(<CalculatorPage />);
      
      expect(screen.getByText(/Calculation Error/)).toBeInTheDocument();
      expect(screen.getByText(/Invalid file format/)).toBeInTheDocument();
    });

    it('allows dismissing error messages', async () => {
      mockState = { status: 'error', error: 'Network error', result: null };
      
      renderWithProviders(<CalculatorPage />);
      
      expect(screen.getByText(/Network error/)).toBeInTheDocument();
      
      const dismissButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(dismissButton);
      
      expect(mockDispatch).toHaveBeenCalledWith({ 
        type: 'SUBMIT_ERROR', 
        payload: null 
      });
    });

    it('handles API errors gracefully', async () => {
      mockSubmitCalculation.mockRejectedValue(new Error('Server error'));
      
      const { container } = renderWithProviders(<CalculatorPage />);
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      const form = container.querySelector('form');
      
      // Upload valid file
      const validFile = new File(['test content'], 'test.csv', { type: 'text/csv' });
      simulateFileUpload(fileInput, validFile);
      
      await waitFor(() => {
        expect(screen.getByText('Selected:')).toBeInTheDocument();
        expect(screen.getByText((content) => content.includes('test.csv'))).toBeInTheDocument();
      }, { timeout: 3000 });
      
      // Submit form
      fireEvent.submit(form!);
      
      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalledWith({ 
          type: 'SUBMIT_ERROR', 
          payload: 'Server error' 
        });
      });
    });
  });

  describe('User Experience Features', () => {
    it('shows different tax year options', () => {
      renderWithProviders(<CalculatorPage />);
      
      const taxYearSelect = screen.getByDisplayValue('2024-2025');
      fireEvent.click(taxYearSelect);
      
      // Check that multiple tax years are available
      expect(screen.getByText('2024-2025')).toBeInTheDocument();
      expect(screen.getByText('2023-2024')).toBeInTheDocument();
      expect(screen.getByText('2022-2023')).toBeInTheDocument();
      expect(screen.getByText('2021-2022')).toBeInTheDocument();
    });

    it('shows different analysis type options', () => {
      renderWithProviders(<CalculatorPage />);
      
      const analysisTypeSelect = screen.getByDisplayValue('Tax & Portfolio Analysis');
      fireEvent.click(analysisTypeSelect);
      
      expect(screen.getByText('Tax & Portfolio Analysis')).toBeInTheDocument();
      expect(screen.getByText('Tax Analysis Only')).toBeInTheDocument();
      expect(screen.getByText('Portfolio Analysis Only')).toBeInTheDocument();
    });

    it('displays comprehensive FAQ information', () => {
      renderWithProviders(<CalculatorPage />);
      
      // Check FAQ topics
      expect(screen.getByText(/What file formats does the calculator accept?/)).toBeInTheDocument();
      expect(screen.getByText(/How accurate are the tax calculations?/)).toBeInTheDocument();
      expect(screen.getByText(/What about data privacy and security?/)).toBeInTheDocument();
      expect(screen.getByText(/Which tax years are supported?/)).toBeInTheDocument();
    });
  });
});