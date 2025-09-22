import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CGTGuide, CGTGuideProps } from './CGTGuide';

describe('CGTGuide', () => {
  const defaultProps: CGTGuideProps = {};

  it('renders page heading', () => {
    render(<CGTGuide {...defaultProps} />);
    
    expect(screen.getByRole('heading', { name: /capital gains tax guide/i })).toBeInTheDocument();
  });

  it('displays HMRC rules and regulations', () => {
    render(<CGTGuide {...defaultProps} />);
    
    expect(screen.getByRole('heading', { name: /hmrc rules and regulations/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /section 104 pooling/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /same-day rule/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /bed and breakfast rule/i })).toBeInTheDocument();
  });

  it('shows calculation methods', () => {
    render(<CGTGuide {...defaultProps} />);
    
    expect(screen.getByRole('heading', { name: /calculation methods/i })).toBeInTheDocument();
    expect(screen.getByText(/matching order priority/i)).toBeInTheDocument();
  });

  it('displays interactive examples', () => {
    render(<CGTGuide {...defaultProps} />);
    
    expect(screen.getByRole('heading', { name: /interactive examples/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /basic disposal/i })).toBeInTheDocument();
  });

  it('shows step-by-step walkthrough', () => {
    render(<CGTGuide {...defaultProps} />);
    
    expect(screen.getByRole('heading', { name: /step-by-step walkthrough/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /identify your transactions/i })).toBeInTheDocument();
  });

  it('displays tax rates and allowances', () => {
    render(<CGTGuide {...defaultProps} />);
    
    expect(screen.getByRole('heading', { name: /tax rates and allowances/i })).toBeInTheDocument();
    expect(screen.getByText('2023/24 Tax Year')).toBeInTheDocument();
    expect(screen.getByText('2024/25 Tax Year')).toBeInTheDocument();
  });

  it('displays practical scenarios correctly', () => {
    render(<CGTGuide {...defaultProps} />);
    
    expect(screen.getByRole('heading', { name: /practical scenarios/i })).toBeInTheDocument();
    expect(screen.getByText(/bonus share allocations/i)).toBeInTheDocument();
  });

  it('displays common mistakes section', () => {
    render(<CGTGuide {...defaultProps} />);
    
    expect(screen.getByRole('heading', { name: /common mistakes/i })).toBeInTheDocument();
    expect(screen.getByText(/incorrect pooling calculations/i)).toBeInTheDocument();
  });

  it('displays reporting requirements correctly', () => {
    render(<CGTGuide {...defaultProps} />);
    
    expect(screen.getByRole('heading', { name: /reporting requirements/i })).toBeInTheDocument();
    expect(screen.getByText(/self assessment requirements/i)).toBeInTheDocument();
  });

  it('handles interactive calculation', async () => {
    render(<CGTGuide {...defaultProps} />);
    
    // Click on calculate example button
    const calculateButton = screen.getByRole('button', { name: /calculate example/i });
    fireEvent.click(calculateButton);
    
    // Check that calculation result is displayed
    await waitFor(() => {
      expect(screen.getByText(/capital gain:/i)).toBeInTheDocument();
    });
  });

  it('displays glossary section', () => {
    render(<CGTGuide {...defaultProps} />);
    
    expect(screen.getByRole('heading', { name: /glossary/i })).toBeInTheDocument();
    expect(screen.getByText(/acquisition cost/i)).toBeInTheDocument();
    expect(screen.getByText(/disposal proceeds/i)).toBeInTheDocument();
  });

  it('shows progress indicator for walkthrough', () => {
    render(<CGTGuide {...defaultProps} />);
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /identify your transactions/i })).toBeInTheDocument();
  });

  it('progresses through interactive examples correctly', async () => {
    render(<CGTGuide {...defaultProps} />);
    
    // Start with step 1
    expect(screen.getByRole('heading', { name: /identify your transactions/i })).toBeInTheDocument();
    
    // Click through to step 2
    fireEvent.click(screen.getByRole('button', { name: /next step/i }));
    expect(screen.getByRole('heading', { name: /apply hmrc matching rules/i })).toBeInTheDocument();
    
    // Click through to step 3
    fireEvent.click(screen.getByRole('button', { name: /next step/i }));
    expect(screen.getByRole('heading', { name: /calculate section 104 pool/i })).toBeInTheDocument();
  });

  it('navigates through step-by-step walkthrough', async () => {
    render(<CGTGuide {...defaultProps} />);
    
    // Check initial step
    expect(screen.getByRole('heading', { name: /identify your transactions/i })).toBeInTheDocument();
    
    // Navigate to next step
    fireEvent.click(screen.getByRole('button', { name: /next step/i }));
    expect(screen.getByRole('heading', { name: /apply hmrc matching rules/i })).toBeInTheDocument();
    
    // Navigate back
    fireEvent.click(screen.getByRole('button', { name: /previous step/i }));
    expect(screen.getByRole('heading', { name: /identify your transactions/i })).toBeInTheDocument();
  });

  it('displays calculation examples with different scenarios', () => {
    render(<CGTGuide {...defaultProps} />);
    
    expect(screen.getByText(/multiple acquisitions/i)).toBeInTheDocument();
  });

  it('handles currency conversion examples', () => {
    render(<CGTGuide {...defaultProps} />);
    
    expect(screen.getByText(/foreign currency considerations/i)).toBeInTheDocument();
    expect(screen.getByText(/convert all amounts to gbp/i)).toBeInTheDocument();
  });

  it('displays different currency examples correctly', () => {
    render(<CGTGuide {...defaultProps} />);
    
    expect(screen.getByText(/foreign currency considerations/i)).toBeInTheDocument();
    expect(screen.getByText(/convert all amounts to gbp/i)).toBeInTheDocument();
  });
});