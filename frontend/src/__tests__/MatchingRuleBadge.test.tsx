import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MatchingRuleBadge } from '../components/common/MatchingRuleBadge';

describe('MatchingRuleBadge', () => {
  it('displays same-day badge correctly', () => {
    render(<MatchingRuleBadge rule="same-day" />);
    
    const badge = screen.getByText('Same Day');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-success');
  });

  it('displays bed-breakfast badge correctly', () => {
    render(<MatchingRuleBadge rule="bed-breakfast" />);
    
    const badge = screen.getByText('30-Day B&B');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-warning');
  });

  it('displays section104 badge correctly', () => {
    render(<MatchingRuleBadge rule="section104" />);
    
    const badge = screen.getByText('Section 104');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-secondary');
  });

  it('has correct tooltip for same-day rule', () => {
    render(<MatchingRuleBadge rule="same-day" />);
    
    const badge = screen.getByText('Same Day');
    expect(badge).toHaveAttribute('title', 'Shares acquired on same day as disposal');
  });

  it('has correct tooltip for bed-breakfast rule', () => {
    render(<MatchingRuleBadge rule="bed-breakfast" />);
    
    const badge = screen.getByText('30-Day B&B');
    expect(badge).toHaveAttribute('title', 'Shares acquired within 30 days after disposal (Bed & Breakfast rule)');
  });

  it('has correct tooltip for section104 rule', () => {
    render(<MatchingRuleBadge rule="section104" />);
    
    const badge = screen.getByText('Section 104');
    expect(badge).toHaveAttribute('title', 'Shares from pooled holdings (Section 104 pool)');
  });

  it('has help cursor style', () => {
    const { container } = render(<MatchingRuleBadge rule="same-day" />);
    
    const badge = container.querySelector('.badge');
    expect(badge).toHaveStyle({ cursor: 'help' });
  });

  it('renders as a span element', () => {
    const { container } = render(<MatchingRuleBadge rule="section104" />);
    
    const badge = container.querySelector('span.badge');
    expect(badge).toBeInTheDocument();
  });

  it('applies correct color classes for each rule', () => {
    const { container: container1 } = render(<MatchingRuleBadge rule="same-day" />);
    expect(container1.querySelector('.bg-success')).toBeInTheDocument();
    
    const { container: container2 } = render(<MatchingRuleBadge rule="bed-breakfast" />);
    expect(container2.querySelector('.bg-warning')).toBeInTheDocument();
    
    const { container: container3 } = render(<MatchingRuleBadge rule="section104" />);
    expect(container3.querySelector('.bg-secondary')).toBeInTheDocument();
  });
});
