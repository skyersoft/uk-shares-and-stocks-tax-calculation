import { render, screen } from '@testing-library/react';
import { LoadingSpinner } from './LoadingSpinner';

describe('LoadingSpinner Component', () => {
  // Basic Rendering Tests
  test('renders loading spinner with default props', () => {
    render(<LoadingSpinner />);
    const spinner = screen.getByRole('status', { hidden: true });
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('spinner-border');
    
    // Check for screen reader text
    const srText = spinner.querySelector('.visually-hidden');
    expect(srText).toBeInTheDocument();
    expect(srText).toHaveTextContent('Loading...');
  });

  test('renders with custom loading text', () => {
    render(<LoadingSpinner text="Processing..." />);
    const spinner = screen.getByRole('status', { hidden: true });
    const srText = spinner.querySelector('.visually-hidden');
    expect(srText).toHaveTextContent('Processing...');
  });

  // Size Tests
  test('renders small size correctly', () => {
    render(<LoadingSpinner size="sm" />);
    const spinner = screen.getByRole('status', { hidden: true });
    expect(spinner).toHaveClass('spinner-border-sm');
  });

  test('renders medium size correctly (default)', () => {
    render(<LoadingSpinner size="md" />);
    const spinner = screen.getByRole('status', { hidden: true });
    expect(spinner).toHaveClass('spinner-border');
    expect(spinner).not.toHaveClass('spinner-border-sm');
  });

  test('renders large size correctly', () => {
    render(<LoadingSpinner size="lg" />);
    const spinner = screen.getByRole('status', { hidden: true });
    expect(spinner).toHaveClass('spinner-border');
    // Large size typically uses custom styles or additional classes
    expect(spinner).toHaveStyle('width: 3rem; height: 3rem;');
  });

  // Variant Tests  
  test('renders border variant (default)', () => {
    render(<LoadingSpinner variant="border" />);
    const spinner = screen.getByRole('status', { hidden: true });
    expect(spinner).toHaveClass('spinner-border');
  });

  test('renders grow variant', () => {
    render(<LoadingSpinner variant="grow" />);
    const spinner = screen.getByRole('status', { hidden: true });
    expect(spinner).toHaveClass('spinner-grow');
  });

  // Color Tests
  test('renders with default color', () => {
    render(<LoadingSpinner />);
    const spinner = screen.getByRole('status', { hidden: true });
    expect(spinner).not.toHaveClass('text-primary');
  });

  test('renders with primary color', () => {
    render(<LoadingSpinner color="primary" />);
    const spinner = screen.getByRole('status', { hidden: true });
    expect(spinner).toHaveClass('text-primary');
  });

  test('renders with secondary color', () => {
    render(<LoadingSpinner color="secondary" />);
    const spinner = screen.getByRole('status', { hidden: true });
    expect(spinner).toHaveClass('text-secondary');
  });

  test('renders with success color', () => {
    render(<LoadingSpinner color="success" />);
    const spinner = screen.getByRole('status', { hidden: true });
    expect(spinner).toHaveClass('text-success');
  });

  test('renders with danger color', () => {
    render(<LoadingSpinner color="danger" />);
    const spinner = screen.getByRole('status', { hidden: true });
    expect(spinner).toHaveClass('text-danger');
  });

  // Centered Tests
  test('renders centered when centered prop is true', () => {
    render(<LoadingSpinner centered />);
    const container = screen.getByRole('status', { hidden: true }).parentElement;
    expect(container).toHaveClass('d-flex', 'justify-content-center', 'align-items-center');
  });

  test('does not render centered container when centered is false', () => {
    render(<LoadingSpinner centered={false} />);
    const spinner = screen.getByRole('status', { hidden: true });
    expect(spinner.parentElement).not.toHaveClass('d-flex');
  });

  // Custom Class Tests
  test('applies custom className', () => {
    render(<LoadingSpinner className="custom-spinner" />);
    const spinner = screen.getByRole('status', { hidden: true });
    expect(spinner).toHaveClass('spinner-border', 'custom-spinner');
  });

  // Label Tests
  test('renders with visible label', () => {
    render(<LoadingSpinner label="Loading data..." />);
    const label = screen.getByText('Loading data...');
    expect(label).toBeInTheDocument();
    expect(label).not.toHaveClass('visually-hidden');
  });

  test('renders with both visible label and screen reader text', () => {
    render(<LoadingSpinner label="Please wait" text="Loading content..." />);
    
    // Visible label
    const visibleLabel = screen.getByText('Please wait');
    expect(visibleLabel).toBeInTheDocument();
    expect(visibleLabel).not.toHaveClass('visually-hidden');
    
    // Screen reader text
    const srText = screen.getByText('Loading content...');
    expect(srText).toBeInTheDocument();
    expect(srText).toHaveClass('visually-hidden');
  });

  // Inline Tests
  test('renders inline spinner', () => {
    render(<LoadingSpinner inline />);
    const container = screen.getByRole('status', { hidden: true }).parentElement;
    expect(container).toHaveClass('d-inline-flex');
  });

  test('renders block spinner (default)', () => {
    render(<LoadingSpinner inline={false} />);
    const spinner = screen.getByRole('status', { hidden: true });
    expect(spinner.parentElement).not.toHaveClass('d-inline-flex');
  });

  // Combination Tests
  test('renders with all props combined', () => {
    render(
      <LoadingSpinner
        size="lg"
        variant="grow"
        color="primary"
        text="Processing your request..."
        label="Please wait"
        centered
        className="custom-loader"
      />
    );
    
    const spinner = screen.getByRole('status', { hidden: true });
    expect(spinner).toHaveClass('spinner-grow', 'text-primary', 'custom-loader');
    
    const container = spinner.parentElement;
    expect(container).toHaveClass('d-flex', 'justify-content-center', 'align-items-center');
    
    const visibleLabel = screen.getByText('Please wait');
    expect(visibleLabel).toBeInTheDocument();
    
    const srText = screen.getByText('Processing your request...');
    expect(srText).toHaveClass('visually-hidden');
  });

  // Accessibility Tests
  test('has proper ARIA role', () => {
    render(<LoadingSpinner />);
    const spinner = screen.getByRole('status', { hidden: true });
    expect(spinner).toHaveAttribute('role', 'status');
  });

  test('has proper ARIA attributes', () => {
    render(<LoadingSpinner />);
    const spinner = screen.getByRole('status', { hidden: true });
    expect(spinner).toHaveAttribute('aria-hidden', 'true');
  });

  test('screen reader text is properly hidden', () => {
    render(<LoadingSpinner />);
    const srText = screen.getByText('Loading...');
    expect(srText).toHaveClass('visually-hidden');
  });

  // HTML Attributes Tests
  test('forwards HTML attributes', () => {
    render(
      <LoadingSpinner 
        id="test-spinner"
        data-testid="custom-spinner"
        style={{ marginTop: '20px' }}
      />
    );
    
    const spinner = screen.getByTestId('custom-spinner');
    expect(spinner).toHaveAttribute('id', 'test-spinner');
    expect(spinner).toHaveStyle('margin-top: 20px');
  });

  // Edge Cases
  test('handles empty text gracefully', () => {
    render(<LoadingSpinner text="" />);
    const spinner = screen.getByRole('status', { hidden: true });
    const srText = spinner.querySelector('.visually-hidden');
    expect(srText).toHaveTextContent('');
  });

  test('handles null text gracefully', () => {
    render(<LoadingSpinner text={null as any} />);
    const spinner = screen.getByRole('status', { hidden: true });
    const srText = spinner.querySelector('.visually-hidden');
    expect(srText).toHaveTextContent('Loading...');
  });

  test('handles undefined text gracefully', () => {
    render(<LoadingSpinner text={undefined} />);
    const spinner = screen.getByRole('status', { hidden: true });
    const srText = spinner.querySelector('.visually-hidden');
    expect(srText).toHaveTextContent('Loading...');
  });

  // Tax Calculator Context Tests
  test('renders calculation loading state', () => {
    render(
      <LoadingSpinner
        text="Calculating capital gains tax..."
        label="Tax Calculation in Progress"
        color="primary"
        size="lg"
        centered
      />
    );
    
    const label = screen.getByText('Tax Calculation in Progress');
    expect(label).toBeInTheDocument();
    
    const srText = screen.getByText('Calculating capital gains tax...');
    expect(srText).toHaveClass('visually-hidden');
    
    const spinner = screen.getByRole('status', { hidden: true });
    expect(spinner).toHaveClass('text-primary');
  });

  test('renders data import loading state', () => {
    render(
      <LoadingSpinner
        text="Importing transaction data..."
        variant="grow"
        color="success"
        inline
      />
    );
    
    const spinner = screen.getByRole('status', { hidden: true });
    expect(spinner).toHaveClass('spinner-grow', 'text-success');
    
    const container = spinner.parentElement;
    expect(container).toHaveClass('d-inline-flex');
    
    const srText = screen.getByText('Importing transaction data...');
    expect(srText).toBeInTheDocument();
  });

  // Performance Tests
  test('renders multiple spinners independently', () => {
    render(
      <div>
        <LoadingSpinner data-testid="spinner1" text="Loading 1" />
        <LoadingSpinner data-testid="spinner2" text="Loading 2" color="primary" />
        <LoadingSpinner data-testid="spinner3" text="Loading 3" variant="grow" />
      </div>
    );
    
    const spinner1 = screen.getByTestId('spinner1');
    const spinner2 = screen.getByTestId('spinner2');
    const spinner3 = screen.getByTestId('spinner3');
    
    expect(spinner1).toHaveClass('spinner-border');
    expect(spinner1).not.toHaveClass('text-primary');
    
    expect(spinner2).toHaveClass('spinner-border', 'text-primary');
    
    expect(spinner3).toHaveClass('spinner-grow');
    
    expect(screen.getByText('Loading 1')).toBeInTheDocument();
    expect(screen.getByText('Loading 2')).toBeInTheDocument();
    expect(screen.getByText('Loading 3')).toBeInTheDocument();
  });
});