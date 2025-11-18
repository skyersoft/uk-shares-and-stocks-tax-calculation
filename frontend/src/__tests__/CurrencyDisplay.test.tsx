import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CurrencyDisplay } from '../components/common/CurrencyDisplay';

describe('CurrencyDisplay', () => {
  it('displays GBP amount without dual currency', () => {
    render(<CurrencyDisplay amount={1000} currency="GBP" />);
    
    expect(screen.getByText('£1,000.00')).toBeInTheDocument();
    expect(screen.queryByText(/\(/)).not.toBeInTheDocument();
  });

  it('displays USD with GBP conversion', () => {
    render(<CurrencyDisplay amount={1500} currency="USD" gbpAmount={1200} />);
    
    expect(screen.getByText('$1,500.00')).toBeInTheDocument();
    expect(screen.getByText('(£1,200.00)')).toBeInTheDocument();
  });

  it('displays EUR with GBP conversion', () => {
    render(<CurrencyDisplay amount={2000} currency="EUR" gbpAmount={1750} />);
    
    expect(screen.getByText('€2,000.00')).toBeInTheDocument();
    expect(screen.getByText('(£1,750.00)')).toBeInTheDocument();
  });

  it('displays JPY with GBP conversion', () => {
    render(<CurrencyDisplay amount={150000} currency="JPY" gbpAmount={850} />);
    
    expect(screen.getByText('¥150,000.00')).toBeInTheDocument();
    expect(screen.getByText('(£850.00)')).toBeInTheDocument();
  });

  it('handles negative amounts with red styling', () => {
    const { container } = render(<CurrencyDisplay amount={-500} currency="USD" gbpAmount={-400} />);
    
    // Component shows "- $500.00" with space
    expect(container.textContent).toContain('500.00');
    expect(container.textContent).toContain('400.00');
    const negativeElement = container.querySelector('.text-danger');
    expect(negativeElement).toBeInTheDocument();
  });

  it('displays CHF currency correctly', () => {
    render(<CurrencyDisplay amount={3000} currency="CHF" gbpAmount={2500} />);
    
    expect(screen.getByText(/CHF/)).toBeInTheDocument();
    expect(screen.getByText(/£2,500.00/)).toBeInTheDocument();
  });

  it('displays CAD currency correctly', () => {
    render(<CurrencyDisplay amount={2500} currency="CAD" gbpAmount={1500} />);
    
    expect(screen.getByText(/C\$/)).toBeInTheDocument();
    expect(screen.getByText(/£1,500.00/)).toBeInTheDocument();
  });

  it('displays AUD currency correctly', () => {
    render(<CurrencyDisplay amount={3500} currency="AUD" gbpAmount={1800} />);
    
    expect(screen.getByText(/A\$/)).toBeInTheDocument();
    expect(screen.getByText(/£1,800.00/)).toBeInTheDocument();
  });

  it('formats numbers with thousand separators', () => {
    render(<CurrencyDisplay amount={1234567.89} currency="USD" gbpAmount={987654.32} />);
    
    expect(screen.getByText(/1,234,567.89/)).toBeInTheDocument();
    expect(screen.getByText(/£987,654.32/)).toBeInTheDocument();
  });

  it('rounds to 2 decimal places', () => {
    render(<CurrencyDisplay amount={100.996} currency="GBP" />);
    
    expect(screen.getByText(/101.00/)).toBeInTheDocument();
  });

  it('handles zero amounts', () => {
    const { container } = render(<CurrencyDisplay amount={0} currency="USD" gbpAmount={0} />);
    
    // When amounts are equal within threshold, shows single value
    expect(container.textContent).toContain('0.00');
  });

  it('works without gbpAmount for non-GBP currencies', () => {
    const { container } = render(<CurrencyDisplay amount={500} currency="USD" />);
    
    expect(container).toHaveTextContent('$500.00');
    expect(container.textContent).not.toContain('(£');
  });

  it('applies custom className when provided', () => {
    const { container } = render(
      <CurrencyDisplay amount={1000} currency="USD" gbpAmount={800} className="custom-class" />
    );
    
    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });

  it('handles showSymbol=false for GBP', () => {
    render(<CurrencyDisplay amount={1000} currency="GBP" showSymbol={false} />);
    
    // Should still show formatted number
    expect(screen.getByText(/1,000\.00/)).toBeInTheDocument();
  });

  it('handles unknown currency codes', () => {
    const { container } = render(<CurrencyDisplay amount={1000} currency="XYZ" gbpAmount={800} />);
    
    // Should display currency code as prefix
    expect(container).toHaveTextContent('XYZ');
    expect(container).toHaveTextContent('(£800.00)');
  });

  it('displays HKD currency correctly', () => {
    render(<CurrencyDisplay amount={10000} currency="HKD" gbpAmount={1000} />);
    
    expect(screen.getByText('HK$10,000.00')).toBeInTheDocument();
    expect(screen.getByText('(£1,000.00)')).toBeInTheDocument();
  });

  it('displays SGD currency correctly', () => {
    render(<CurrencyDisplay amount={2000} currency="SGD" gbpAmount={1200} />);
    
    expect(screen.getByText('S$2,000.00')).toBeInTheDocument();
    expect(screen.getByText('(£1,200.00)')).toBeInTheDocument();
  });
});
