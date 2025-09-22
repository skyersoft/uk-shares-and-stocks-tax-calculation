import { render, screen } from '@testing-library/react';
import { Privacy, PrivacyProps } from './Privacy';

describe('Privacy', () => {
  const defaultProps: PrivacyProps = {};

  it('renders page heading', () => {
    render(<Privacy {...defaultProps} />);
    
    expect(screen.getByRole('heading', { name: /privacy policy/i })).toBeInTheDocument();
  });

  it('displays data collection information', () => {
    render(<Privacy {...defaultProps} />);
    
    expect(screen.getByRole('heading', { name: 'Data Collection' })).toBeInTheDocument();
    expect(screen.getByText(/we do not collect, store, or transmit/i)).toBeInTheDocument();
  });

  it('shows local processing information', () => {
    render(<Privacy {...defaultProps} />);
    
    expect(screen.getByRole('heading', { name: /local processing/i })).toBeInTheDocument();
    expect(screen.getByText(/all calculations are performed locally/i)).toBeInTheDocument();
  });

  it('displays security measures', () => {
    render(<Privacy {...defaultProps} />);
    
    expect(screen.getByRole('heading', { name: /security measures/i })).toBeInTheDocument();
    expect(screen.getByText(/client-side encryption/i)).toBeInTheDocument();
  });

  it('shows cookies and tracking information', () => {
    render(<Privacy {...defaultProps} />);
    
    expect(screen.getByRole('heading', { name: /cookies and tracking/i })).toBeInTheDocument();
    expect(screen.getByText(/we do not use tracking cookies/i)).toBeInTheDocument();
  });

  it('displays third-party services section', () => {
    render(<Privacy {...defaultProps} />);
    
    expect(screen.getByRole('heading', { name: /third-party services/i })).toBeInTheDocument();
    expect(screen.getByText(/we do not integrate with third-party/i)).toBeInTheDocument();
  });

  it('shows data retention policy', () => {
    render(<Privacy {...defaultProps} />);
    
    expect(screen.getByRole('heading', { name: 'Data Retention' })).toBeInTheDocument();
    expect(screen.getByText(/no data is retained on our servers/i)).toBeInTheDocument();
  });

  it('displays user rights section', () => {
    render(<Privacy {...defaultProps} />);
    
    expect(screen.getByRole('heading', { name: /your rights/i })).toBeInTheDocument();
    expect(screen.getByText(/you have full control/i)).toBeInTheDocument();
  });

  it('shows contact information for privacy concerns', () => {
    render(<Privacy {...defaultProps} />);
    
    expect(screen.getByRole('heading', { name: /contact us/i })).toBeInTheDocument();
    expect(screen.getByText(/privacy@ibkr-tax-calculator.com/i)).toBeInTheDocument();
  });

  it('displays policy updates information', () => {
    render(<Privacy {...defaultProps} />);
    
    expect(screen.getByRole('heading', { name: /policy updates/i })).toBeInTheDocument();
    expect(screen.getByText(/we may update this privacy policy/i)).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<Privacy className="custom-privacy" />);
    
    expect(container.firstChild).toHaveClass('privacy-page');
    expect(container.firstChild).toHaveClass('custom-privacy');
  });

  it('shows effective date and version', () => {
    render(<Privacy {...defaultProps} />);
    
    expect(screen.getByText('Effective Date:')).toBeInTheDocument();
    expect(screen.getByText(/september 2024/i)).toBeInTheDocument();
    expect(screen.getByText('Version:')).toBeInTheDocument();
  });
});