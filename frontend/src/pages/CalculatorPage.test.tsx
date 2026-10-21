import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import '@testing-library/jest-dom';
import CalculatorPage from './CalculatorPage';

// Mock the MultiStepCalculator component
jest.mock('../components/calculator/MultiStepCalculator', () => ({
  MultiStepCalculator: ({ onComplete }: { onComplete: (data: any) => void }) => (
    <div data-testid="multi-step-calculator">
      <button onClick={() => onComplete({ brokerFiles: [{ id: '1', file: new File(['test'], 'test.csv') }], taxYear: '2024-2025', analysisType: 'both' })}>
        Complete Wizard
      </button>
    </div>
  ),
}));

// SEOHead imports vite-react-ssg, which Jest cannot resolve
jest.mock('../components/seo/SEOHead', () => ({ __esModule: true, default: () => null }));

// Mock API (keep the real error classes; apiBase uses import.meta)
jest.mock('../services/apiBase', () => ({ getApiBase: () => '' }));
jest.mock('../services/api', () => ({
  ...jest.requireActual('../services/api'),
  submitCalculation: jest.fn(),
}));

jest.mock('../utils/analytics', () => ({
  trackCalculationStart: jest.fn(),
  trackCalculationSuccess: jest.fn(),
  trackCalculationError: jest.fn(),
  trackFileUpload: jest.fn(),
}));

import { submitCalculation, CSVValidationError, BrokerDetectionError } from '../services/api';
import { trackCalculationError } from '../utils/analytics';

// Mock CalculationContext
const mockDispatch = jest.fn();
let mockState: any = { status: 'idle', error: null, result: null };

jest.mock('../context/CalculationContext', () => ({
  __esModule: true,
  useCalculation: () => ({
    state: mockState,
    dispatch: mockDispatch,
  }),
}));

// Mock normalizer
jest.mock('../utils/resultsNormalizer', () => ({
  normalizeCalculationResults: jest.fn((data) => data),
}));

describe('CalculatorPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockState = { status: 'idle', error: null, result: null };
  });

  const renderPage = () => {
    return render(
      <HelmetProvider>
        <BrowserRouter>
          <CalculatorPage />
        </BrowserRouter>
      </HelmetProvider>
    );
  };

  it('renders the page with hero section', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: /UK Tax Calculator/i })).toBeInTheDocument();
    expect(screen.getByText(/Capital Gains Tax & income analysis following HMRC guidelines/i)).toBeInTheDocument();
  });

  it('renders the disclaimer', () => {
    renderPage();

    expect(screen.getByText(/For informational purposes only/i)).toBeInTheDocument();
  });

  it('renders the MultiStepCalculator component', () => {
    renderPage();

    expect(screen.getByTestId('multi-step-calculator')).toBeInTheDocument();
  });

  it('dispatches a structured error for CSVValidationError', async () => {
    (submitCalculation as jest.Mock).mockRejectedValue(
      new CSVValidationError('Invalid CSV format', ['Quantity'], ['Date', 'Quantity']));
    renderPage();
    fireEvent.click(screen.getByText('Complete Wizard'));
    await waitFor(() => expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SUBMIT_ERROR',
      payload: 'Invalid CSV format',
      detail: { kind: 'missing_columns', message: 'Invalid CSV format', missingColumns: ['Quantity'], requiredColumns: ['Date', 'Quantity'] },
    }));
    expect(trackCalculationError).toHaveBeenCalledWith('csv_validation_error', 'Invalid CSV format');
  });

  it('dispatches a structured error for BrokerDetectionError', async () => {
    (submitCalculation as jest.Mock).mockRejectedValue(
      new BrokerDetectionError('Could not detect broker from file', ['Trading 212', 'Freetrade']));
    renderPage();
    fireEvent.click(screen.getByText('Complete Wizard'));
    await waitFor(() => expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SUBMIT_ERROR',
      payload: 'Could not detect broker from file',
      detail: { kind: 'unknown_broker', message: 'Could not detect broker from file', supportedBrokers: ['Trading 212', 'Freetrade'] },
    }));
    expect(trackCalculationError).toHaveBeenCalledWith('broker_detection_error', 'Could not detect broker from file');
  });

  it('keeps plain messages for other errors', async () => {
    (submitCalculation as jest.Mock).mockRejectedValue(new Error('HTTP 500'));
    renderPage();
    fireEvent.click(screen.getByText('Complete Wizard'));
    await waitFor(() => expect(mockDispatch).toHaveBeenCalledWith({ type: 'SUBMIT_ERROR', payload: 'HTTP 500' }));
  });
});
