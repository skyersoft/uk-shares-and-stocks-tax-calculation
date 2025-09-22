import { render, screen } from '@testing-library/react';
import { Terms, TermsProps } from './Terms';

describe('Terms', () => {
  const defaultProps: TermsProps = {};

  it('renders page heading', () => {
    render(<Terms {...defaultProps} />);
    
    expect(screen.getByRole('heading', { name: /terms of service/i })).toBeInTheDocument();
  });

  it('displays acceptance of terms section', () => {
    render(<Terms {...defaultProps} />);
    
    expect(screen.getByRole('heading', { name: /acceptance of terms/i })).toBeInTheDocument();
    expect(screen.getByText(/by accessing and using/i)).toBeInTheDocument();
  });

  it('shows service description', () => {
    render(<Terms {...defaultProps} />);
    
    expect(screen.getByRole('heading', { name: /service description/i })).toBeInTheDocument();
    expect(screen.getByText(/uk capital gains tax calculator/i)).toBeInTheDocument();
  });

  it('displays user responsibilities', () => {
    render(<Terms {...defaultProps} />);
    
    expect(screen.getByRole('heading', { name: /user responsibilities/i })).toBeInTheDocument();
    expect(screen.getByText(/you are responsible for/i)).toBeInTheDocument();
  });

  it('shows disclaimers section', () => {
    render(<Terms {...defaultProps} />);
    
    expect(screen.getByRole('heading', { name: /disclaimers/i })).toBeInTheDocument();
    expect(screen.getByText(/this service is provided/i)).toBeInTheDocument();
  });

  it('displays limitation of liability', () => {
    render(<Terms {...defaultProps} />);
    
    expect(screen.getByRole('heading', { name: /limitation of liability/i })).toBeInTheDocument();
    expect(screen.getByText(/we shall not be liable/i)).toBeInTheDocument();
  });

  it('shows intellectual property section', () => {
    render(<Terms {...defaultProps} />);
    
    expect(screen.getByRole('heading', { name: /intellectual property/i })).toBeInTheDocument();
    expect(screen.getByText(/all content and software/i)).toBeInTheDocument();
  });

  it('displays termination clause', () => {
    render(<Terms {...defaultProps} />);
    
    expect(screen.getByRole('heading', { name: /termination/i })).toBeInTheDocument();
    expect(screen.getByText(/we may terminate/i)).toBeInTheDocument();
  });

  it('shows governing law information', () => {
    render(<Terms {...defaultProps} />);
    
    expect(screen.getByRole('heading', { name: /governing law/i })).toBeInTheDocument();
    expect(screen.getByText(/these terms shall be governed/i)).toBeInTheDocument();
  });

  it('displays contact information', () => {
    render(<Terms {...defaultProps} />);
    
    expect(screen.getByRole('heading', { name: /contact information/i })).toBeInTheDocument();
    expect(screen.getByText(/legal@ibkr-tax-calculator.com/i)).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<Terms className="custom-terms" />);
    
    expect(container.firstChild).toHaveClass('terms-page');
    expect(container.firstChild).toHaveClass('custom-terms');
  });

  it('shows effective date and version', () => {
    render(<Terms {...defaultProps} />);
    
    expect(screen.getByText('Effective Date:')).toBeInTheDocument();
    expect(screen.getByText(/september 2024/i)).toBeInTheDocument();
    expect(screen.getByText('Version:')).toBeInTheDocument();
  });
});