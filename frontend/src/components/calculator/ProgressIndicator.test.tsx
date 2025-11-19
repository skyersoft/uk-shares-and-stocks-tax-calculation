import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ProgressIndicator } from './ProgressIndicator';
import { WIZARD_STEPS } from '../../types/calculator';

describe('ProgressIndicator', () => {
  const mockSteps = WIZARD_STEPS;
  const totalSteps = 4;

  describe('Basic Rendering', () => {
    it('renders all steps', () => {
      render(<ProgressIndicator steps={mockSteps} currentStep={1} totalSteps={totalSteps} />);
      
      // Use getAllByText since step titles appear in multiple places
      const incomeSourcesElements = screen.getAllByText(/Income Sources/i);
      expect(incomeSourcesElements.length).toBeGreaterThan(0);
      
      const uploadElements = screen.getAllByText(/Upload & Details/i);
      expect(uploadElements.length).toBeGreaterThan(0);
    });

    it('displays step counter', () => {
      render(<ProgressIndicator steps={mockSteps} currentStep={1} totalSteps={totalSteps} />);
      
      expect(screen.getByText(/Step 1 of 4/i)).toBeInTheDocument();
    });

    it('shows correct step counter for step 2', () => {
      render(<ProgressIndicator steps={mockSteps} currentStep={2} totalSteps={totalSteps} />);
      
      expect(screen.getByText(/Step 2 of 4/i)).toBeInTheDocument();
    });

    it('shows correct step counter for step 3', () => {
      render(<ProgressIndicator steps={mockSteps} currentStep={3} totalSteps={totalSteps} />);
      
      expect(screen.getByText(/Step 3 of 4/i)).toBeInTheDocument();
    });

    it('shows correct percentage for step 4', () => {
      render(<ProgressIndicator steps={mockSteps} currentStep={4} totalSteps={totalSteps} />);
      
      expect(screen.getByText(/Step 4 of 4/i)).toBeInTheDocument();
      expect(screen.getByText(/100%/i)).toBeInTheDocument();
    });
  });

  describe('Step Status Indicators', () => {
    it('marks steps before current as completed', () => {
      const { container } = render(<ProgressIndicator steps={mockSteps} currentStep={3} totalSteps={totalSteps} />);
      
      // Check that completed steps show checkmark icons
      const checkIcons = container.querySelectorAll('.fa-check');
      expect(checkIcons.length).toBeGreaterThan(0); // Steps 1 and 2 should have checkmarks
    });

    it('marks current step as active', () => {
      render(<ProgressIndicator steps={mockSteps} currentStep={2} totalSteps={totalSteps} />);
      
      // Current step should display "2" and be highlighted
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText(/Step 2 of 4/i)).toBeInTheDocument();
    });

    it('marks steps after current as pending', () => {
      render(<ProgressIndicator steps={mockSteps} currentStep={2} totalSteps={totalSteps} />);
      
      // Future steps show their numbers
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('renders mobile view progress bar on small screens', () => {
      global.innerWidth = 375;
      global.dispatchEvent(new Event('resize'));
      
      render(<ProgressIndicator steps={mockSteps} currentStep={2} totalSteps={totalSteps} />);
      
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('renders desktop timeline on large screens', () => {
      global.innerWidth = 1920;
      global.dispatchEvent(new Event('resize'));
      
      const { container } = render(<ProgressIndicator steps={mockSteps} currentStep={2} totalSteps={totalSteps} />);
      
      // Desktop view should show all step circles
      const stepCircles = container.querySelectorAll('.rounded-circle');
      expect(stepCircles.length).toBe(4);
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes for progress bar', () => {
      render(<ProgressIndicator steps={mockSteps} currentStep={2} totalSteps={totalSteps} />);
      
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow');
      expect(progressBar).toHaveAttribute('aria-valuemin');
      expect(progressBar).toHaveAttribute('aria-valuemax');
    });

    it('provides accessible step descriptions', () => {
      render(<ProgressIndicator steps={mockSteps} currentStep={1} totalSteps={totalSteps} />);
      
      // Check that step descriptions are rendered
      const selectYourIncome = screen.getAllByText(/Select your income sources/i);
      expect(selectYourIncome.length).toBeGreaterThan(0);
    });
  });
});
