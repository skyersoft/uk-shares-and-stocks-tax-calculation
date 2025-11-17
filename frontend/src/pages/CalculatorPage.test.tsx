import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import CalculatorPage from './CalculatorPage';

// Mock the MultiStepCalculator component
jest.mock('../components/calculator/MultiStepCalculator', () => ({
  MultiStepCalculator: ({ onComplete }: { onComplete: (data: any) => void }) => (
    <div data-testid="multi-step-calculator">
      <button onClick={() => onComplete({ file: new File(['test'], 'test.csv'), taxYear: '2024-2025' })}>
        Complete Wizard
      </button>
    </div>
  ),
}));

// Mock API
jest.mock('../services/api', () => ({
  submitCalculation: jest.fn(),
}));

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
      <BrowserRouter>
        <CalculatorPage />
      </BrowserRouter>
    );
  };

  it('renders the page with hero section', () => {
    renderPage();
    
    expect(screen.getByRole('heading', { name: /UK Tax Calculator/i })).toBeInTheDocument();
    expect(screen.getByText(/Calculate your Capital Gains Tax and income tax for informational purposes/i)).toBeInTheDocument();
  });

  it('renders the disclaimer', () => {
    renderPage();
    
    expect(screen.getByText(/This calculator is for informational purposes only/i)).toBeInTheDocument();
  });

  it('renders the MultiStepCalculator component', () => {
    renderPage();
    
    expect(screen.getByTestId('multi-step-calculator')).toBeInTheDocument();
  });
});
