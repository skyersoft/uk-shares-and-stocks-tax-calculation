import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DisposalDetailsTable } from '../components/results/DisposalDetailsTable';
import { DisposalEvent } from '../types/calculation';

describe('DisposalDetailsTable', () => {
  const mockDisposalEvents: DisposalEvent[] = [
    {
      disposal_id: 'disp-001',
      disposal_date: '2024-06-15',
      security_symbol: 'AAPL',
      security_name: 'Apple Inc.',
      security_country: 'US',
      quantity: 100,
      cost_original_amount: 15000,
      cost_original_currency: 'USD',
      cost_fx_rate: 1.25,
      cost_gbp: 12000,
      cost_commission: 10,
      acquisition_date: '2024-01-15',
      proceeds_original_amount: 18000,
      proceeds_original_currency: 'USD',
      proceeds_fx_rate: 1.30,
      proceeds_gbp: 13846.15,
      proceeds_commission: 10,
      withholding_tax: 0,
      fx_gain_loss: 100.50,
      cgt_gain_loss: 1735.65,
      total_gain_loss: 1836.15,
      matching_rule: 'same-day',
      allowable_cost: 12010,
      net_proceeds: 13836.15
    },
    {
      disposal_id: 'disp-002',
      disposal_date: '2024-07-20',
      security_symbol: 'MSFT',
      security_name: 'Microsoft Corporation',
      security_country: 'US',
      quantity: 50,
      cost_original_amount: 10000,
      cost_original_currency: 'USD',
      cost_fx_rate: 1.28,
      cost_gbp: 7812.50,
      cost_commission: 5,
      acquisition_date: '2024-02-10',
      proceeds_original_amount: 11500,
      proceeds_original_currency: 'USD',
      proceeds_fx_rate: 1.32,
      proceeds_gbp: 8712.12,
      proceeds_commission: 5,
      withholding_tax: 0,
      fx_gain_loss: -50.25,
      cgt_gain_loss: 949.87,
      total_gain_loss: 899.62,
      matching_rule: 'bed-breakfast',
      allowable_cost: 7817.50,
      net_proceeds: 8707.12
    },
    {
      disposal_id: 'disp-003',
      disposal_date: '2024-08-10',
      security_symbol: 'GOOGL',
      security_name: 'Alphabet Inc.',
      security_country: 'US',
      quantity: 75,
      cost_original_amount: 12000,
      cost_original_currency: 'GBP',
      cost_fx_rate: 1.00,
      cost_gbp: 12000,
      cost_commission: 8,
      acquisition_date: '2024-03-05',
      proceeds_original_amount: 11000,
      proceeds_original_currency: 'GBP',
      proceeds_fx_rate: 1.00,
      proceeds_gbp: 11000,
      proceeds_commission: 8,
      withholding_tax: 0,
      fx_gain_loss: 0,
      cgt_gain_loss: -1016,
      total_gain_loss: -1016,
      matching_rule: 'section104',
      allowable_cost: 12008,
      net_proceeds: 10992
    }
  ];

  it('renders disposal events table with all data', () => {
    render(<DisposalDetailsTable disposalEvents={mockDisposalEvents} />);
    
    expect(screen.getByText('Detailed Disposal Breakdown')).toBeInTheDocument();
    expect(screen.getByText('3 disposals with FX tracking')).toBeInTheDocument();
    
    // Check security symbols are rendered
    expect(screen.getByText('AAPL')).toBeInTheDocument();
    expect(screen.getByText('MSFT')).toBeInTheDocument();
    expect(screen.getByText('GOOGL')).toBeInTheDocument();
  });

  it('displays dual currency format correctly', () => {
    render(<DisposalDetailsTable disposalEvents={mockDisposalEvents} />);
    
    // AAPL should show USD amounts with GBP in parentheses
    const aaplRow = screen.getByText('AAPL').closest('tr');
    expect(aaplRow).toHaveTextContent('$15,000.00');
    expect(aaplRow).toHaveTextContent('(£12,000.00)');
  });

  it('shows matching rule badges', () => {
    render(<DisposalDetailsTable disposalEvents={mockDisposalEvents} />);
    
    expect(screen.getByText('Same Day')).toBeInTheDocument();
    expect(screen.getByText('30-Day B&B')).toBeInTheDocument();
    expect(screen.getByText('Section 104')).toBeInTheDocument();
  });

  it('calculates and displays totals correctly', () => {
    render(<DisposalDetailsTable disposalEvents={mockDisposalEvents} />);
    
    // Expected totals:
    // FX: 100.50 + (-50.25) + 0 = 50.25
    // CGT: 1735.65 + 949.87 + (-1016) = 1669.52
    // Total: 1836.15 + 899.62 + (-1016) = 1719.77
    
    const totalsRow = screen.getByText('Totals:').closest('tr');
    expect(totalsRow).toHaveTextContent('50.25');
    expect(totalsRow).toHaveTextContent('1669.52');
    expect(totalsRow).toHaveTextContent('1719.77');
  });

  it('applies correct styling for gains and losses', () => {
    const { container } = render(<DisposalDetailsTable disposalEvents={mockDisposalEvents} />);
    
    // Find rows with positive gains (should have text-success class)
    const successElements = container.querySelectorAll('.text-success');
    expect(successElements.length).toBeGreaterThan(0);
    
    // Find rows with losses (should have text-danger class)
    const dangerElements = container.querySelectorAll('.text-danger');
    expect(dangerElements.length).toBeGreaterThan(0);
  });

  it('sorts by date when clicking date header', () => {
    render(<DisposalDetailsTable disposalEvents={mockDisposalEvents} />);
    
    const dateHeader = screen.getByText('Date').closest('th');
    fireEvent.click(dateHeader!);
    
    // After clicking, order should change
    const rows = screen.getAllByRole('row');
    // First disposal should be earliest date (2024-06-15)
    expect(rows[1]).toHaveTextContent('15 Jun 2024');
  });

  it('sorts by security symbol when clicking security header', () => {
    render(<DisposalDetailsTable disposalEvents={mockDisposalEvents} />);
    
    const symbolHeader = screen.getByText('Security').closest('th');
    fireEvent.click(symbolHeader!);
    
    const rows = screen.getAllByRole('row');
    // After sorting desc, should show MSFT first (alphabetically last)
    expect(rows[1]).toHaveTextContent('MSFT');
  });

  it('toggles sort order when clicking same header twice', () => {
    render(<DisposalDetailsTable disposalEvents={mockDisposalEvents} />);
    
    const quantityHeader = screen.getByText('Qty').closest('th');
    
    // First click - descending
    fireEvent.click(quantityHeader!);
    let rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('100'); // Largest quantity
    
    // Second click - ascending
    fireEvent.click(quantityHeader!);
    rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('50'); // Smallest quantity
  });

  it('displays FX rates for non-GBP currencies', () => {
    render(<DisposalDetailsTable disposalEvents={mockDisposalEvents} />);
    
    // Should show FX rates for USD transactions
    expect(screen.getByText('@ 1.2500')).toBeInTheDocument();
    expect(screen.getByText('@ 1.3000')).toBeInTheDocument();
  });

  it('does not display FX rates for GBP transactions', () => {
    render(<DisposalDetailsTable disposalEvents={mockDisposalEvents} />);
    
    // GOOGL is GBP, should not show "@ 1.0000"
    const googleRow = screen.getByText('GOOGL').closest('tr');
    expect(googleRow).not.toHaveTextContent('@ 1.0000');
  });

  it('returns null when no disposal events provided', () => {
    const { container } = render(<DisposalDetailsTable disposalEvents={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('displays commission totals correctly', () => {
    render(<DisposalDetailsTable disposalEvents={mockDisposalEvents} />);
    
    // AAPL: 10 + 10 = 20
    const aaplRow = screen.getByText('AAPL').closest('tr');
    expect(aaplRow).toHaveTextContent('£20.00');
    
    // MSFT: 5 + 5 = 10
    const msftRow = screen.getByText('MSFT').closest('tr');
    expect(msftRow).toHaveTextContent('£10.00');
  });

  it('shows security country badges', () => {
    render(<DisposalDetailsTable disposalEvents={mockDisposalEvents} />);
    
    const countryBadges = screen.getAllByText('US');
    expect(countryBadges).toHaveLength(3);
  });

  it('formats dates correctly', () => {
    render(<DisposalDetailsTable disposalEvents={mockDisposalEvents} />);
    
    expect(screen.getByText('15 Jun 2024')).toBeInTheDocument();
    expect(screen.getByText('20 Jul 2024')).toBeInTheDocument();
    expect(screen.getByText('10 Aug 2024')).toBeInTheDocument();
  });

  it('displays footer explanation', () => {
    render(<DisposalDetailsTable disposalEvents={mockDisposalEvents} />);
    
    expect(screen.getByText(/FX Gain\/Loss represents foreign exchange/)).toBeInTheDocument();
    expect(screen.getByText(/CGT Gain\/Loss is the pure capital gain/)).toBeInTheDocument();
  });
});
