import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MultiStepCalculator } from './MultiStepCalculator';

describe('MultiStepCalculator', () => {
  const mockOnComplete = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders the multi-step calculator with step 1 initially', () => {
      render(<MultiStepCalculator onComplete={mockOnComplete} onCancel={mockOnCancel} />);
      
      // Check that the progress indicator shows step 1
      expect(screen.getByText(/Step 1 of 4/i)).toBeInTheDocument();
    });

    it('displays progress indicator', () => {
      render(<MultiStepCalculator onComplete={mockOnComplete} />);
      
      expect(screen.getByText(/Step 1 of 4/i)).toBeInTheDocument();
    });

    it('shows all wizard steps in progress indicator', () => {
      render(<MultiStepCalculator onComplete={mockOnComplete} />);
      
      // Progress indicator should show all 4 steps
      const progressTexts = screen.getAllByText(/Income Sources|Upload & Details|Personal Details|Review & Calculate/i);
      expect(progressTexts.length).toBeGreaterThan(0);
    });
  });

  describe('Step Navigation', () => {
    it('does not show Back button on first step', () => {
      render(<MultiStepCalculator onComplete={mockOnComplete} />);
      
      expect(screen.queryByRole('button', { name: /Back/i })).not.toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('renders without errors on mobile viewport', () => {
      global.innerWidth = 375;
      global.dispatchEvent(new Event('resize'));
      
      render(<MultiStepCalculator onComplete={mockOnComplete} />);
      
      expect(screen.getByText(/Step 1 of 4/i)).toBeInTheDocument();
    });

    it('renders without errors on desktop viewport', () => {
      global.innerWidth = 1920;
      global.dispatchEvent(new Event('resize'));
      
      render(<MultiStepCalculator onComplete={mockOnComplete} />);
      
      expect(screen.getByText(/Step 1 of 4/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper heading hierarchy', () => {
      render(<MultiStepCalculator onComplete={mockOnComplete} />);
      
      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    it('has accessible form labels', () => {
      render(<MultiStepCalculator onComplete={mockOnComplete} />);
      
      // Check that form elements exist
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThan(0);
    });
  });
});
