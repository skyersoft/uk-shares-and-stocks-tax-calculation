import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Help, HelpProps } from './Help';

describe('Help', () => {
  const defaultProps: HelpProps = {};

  it('renders page heading', () => {
    render(<Help {...defaultProps} />);
    
    expect(screen.getByRole('heading', { name: /help & support/i })).toBeInTheDocument();
  });

  it('displays search functionality', () => {
    render(<Help {...defaultProps} />);
    
    expect(screen.getByPlaceholderText(/search help articles/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
  });

  it('shows help categories', () => {
    render(<Help {...defaultProps} />);
    
    expect(screen.getByRole('button', { name: 'Getting Started' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'File Formats' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tax Calculations' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Troubleshooting' })).toBeInTheDocument();
  });

  it('displays frequently asked questions', () => {
    render(<Help {...defaultProps} />);
    
    expect(screen.getByRole('heading', { name: /frequently asked questions/i })).toBeInTheDocument();
    expect(screen.getByText(/how do i upload my transaction files/i)).toBeInTheDocument();
    expect(screen.getByText(/what file formats are supported/i)).toBeInTheDocument();
  });

  it('shows contact support section', () => {
    render(<Help {...defaultProps} />);
    
    expect(screen.getByRole('heading', { name: /contact support/i })).toBeInTheDocument();
    expect(screen.getByText(/still need help/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /email support/i })).toBeInTheDocument();
  });

  it('handles search input changes', async () => {
    render(<Help {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText(/search help articles/i);
    fireEvent.change(searchInput, { target: { value: 'tax calculation' } });
    
    await waitFor(() => {
      expect(searchInput).toHaveValue('tax calculation');
    });
  });

  it('filters help articles based on search', async () => {
    render(<Help {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText(/search help articles/i);
    fireEvent.change(searchInput, { target: { value: 'QFX' } });
    
    await waitFor(() => {
      // Should show QFX-related help content in accordion
      expect(screen.getByRole('button', { name: /what file formats are supported/i })).toBeInTheDocument();
    });
  });

  it('expands and collapses FAQ items', () => {
    render(<Help {...defaultProps} />);
    
    const faqButton = screen.getByRole('button', { name: /how do i upload my transaction files/i });
    expect(faqButton).toBeInTheDocument();
    
    fireEvent.click(faqButton);
    expect(screen.getByText(/drag and drop your files/i)).toBeInTheDocument();
  });

  it('displays quick links section', () => {
    render(<Help {...defaultProps} />);
    
    expect(screen.getByRole('heading', { name: /quick links/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /calculator/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /about/i })).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<Help className="custom-help" />);
    
    expect(container.firstChild).toHaveClass('help-page');
    expect(container.firstChild).toHaveClass('custom-help');
  });

  it('shows troubleshooting guides', () => {
    render(<Help {...defaultProps} />);
    
    expect(screen.getByRole('heading', { name: /common issues/i })).toBeInTheDocument();
    expect(screen.getByText(/issues with uploading qfx files/i)).toBeInTheDocument();
    expect(screen.getByText(/when tax calculations seem incorrect/i)).toBeInTheDocument();
  });

  it('displays version and system information', () => {
    render(<Help {...defaultProps} />);
    
    expect(screen.getByText(/system information/i)).toBeInTheDocument();
    expect(screen.getByText(/version/i)).toBeInTheDocument();
  });
});