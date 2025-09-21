import { render, screen } from '@testing-library/react';
import { TaxCalculations } from './TaxCalculations';
import { TaxCalculation } from '../../types/calculation';

const mockTaxCalculations: TaxCalculation = {
  capital_gains_tax: 2000,
  dividend_tax: 500,
  total_tax_liability: 2500,
  section_104_pools: {
    'AAPL': {
      quantity: 100,
      total_cost: 14000,
      avg_cost: 140
    },
    'MSFT': {
      quantity: 50,
      total_cost: 14000,
      avg_cost: 280
    }
  },
  disposal_calculations: [
    {
      symbol: 'AAPL',
      disposal_date: '2024-01-15',
      quantity: 25,
      gain_loss: 750,
      proceeds: 4000
    },
    {
      symbol: 'MSFT',
      disposal_date: '2024-02-20',
      quantity: 10,
      gain_loss: -200,
      proceeds: 2800
    },
    {
      symbol: 'VOO',
      disposal_date: '2024-03-10',
      quantity: 5,
      gain_loss: 300,
      proceeds: 2000
    }
  ]
};

const mockZeroTaxCalculations: TaxCalculation = {
  capital_gains_tax: 0,
  dividend_tax: 0,
  total_tax_liability: 0,
  section_104_pools: {},
  disposal_calculations: []
};

describe('TaxCalculations', () => {
  it('renders tax calculations with tax liability', () => {
    render(<TaxCalculations taxCalculations={mockTaxCalculations} />);
    
    // Check main title
    expect(screen.getByText('UK Tax Calculations')).toBeInTheDocument();
    
    // Check tax warning alert
    expect(screen.getByText('Tax Liability Identified')).toBeInTheDocument();
    expect(screen.getByText(/You may need to report these gains/)).toBeInTheDocument();
    
    // Check tax amounts
    expect(screen.getByText('Capital Gains Tax')).toBeInTheDocument();
    expect(screen.getByText('£2,000.00')).toBeInTheDocument();
    
    expect(screen.getByText('Dividend Tax')).toBeInTheDocument();
    expect(screen.getByText('£500.00')).toBeInTheDocument();
    
    expect(screen.getByText('Total Tax Liability')).toBeInTheDocument();
    expect(screen.getByText('£2,500.00')).toBeInTheDocument();
  });

  it('displays section 104 pools correctly', () => {
    render(<TaxCalculations taxCalculations={mockTaxCalculations} />);
    
    expect(screen.getAllByText('Section 104 Pools')).toBeTruthy();
    expect(screen.getByText(/track the average cost/)).toBeInTheDocument();
    
    // Check AAPL pool
    expect(screen.getAllByText('AAPL')).toBeTruthy();
    expect(screen.getByText('100')).toBeInTheDocument(); // quantity
    expect(screen.getAllByText('£14,000.00')).toHaveLength(2); // total cost (appears twice for both pools)
    expect(screen.getByText('£140.00')).toBeInTheDocument(); // avg cost
    
    // Check MSFT pool
    expect(screen.getAllByText('MSFT')).toBeTruthy();
    expect(screen.getByText('50')).toBeInTheDocument(); // quantity
  });

  it('displays disposal calculations correctly', () => {
    render(<TaxCalculations taxCalculations={mockTaxCalculations} />);
    
    expect(screen.getByText('Share Disposals')).toBeInTheDocument();
    expect(screen.getByText(/Detailed calculations for each share disposal/)).toBeInTheDocument();
    
    // Check disposal entries
    expect(screen.getByText('2024-01-15')).toBeInTheDocument();
    expect(screen.getByText('+£750.00')).toBeInTheDocument();
    expect(screen.getByText('25 shares')).toBeInTheDocument();
    
    expect(screen.getByText('2024-02-20')).toBeInTheDocument();
    expect(screen.getByText('-£200.00')).toBeInTheDocument();
    expect(screen.getByText('10 shares')).toBeInTheDocument();
  });

  it('handles zero tax liability correctly', () => {
    render(<TaxCalculations taxCalculations={mockZeroTaxCalculations} />);
    
    // Should not show tax warning
    expect(screen.queryByText('Tax Liability Identified')).not.toBeInTheDocument();
    
    // Should show zero amounts
    expect(screen.getByText('Capital Gains Tax')).toBeInTheDocument();
    expect(screen.getAllByText('£0.00')).toHaveLength(3); // CGT, Dividend Tax, Total
    
    // Should show "No Tax" badges
    expect(screen.getAllByText('No Tax')).toHaveLength(3);
  });

  it('handles empty section 104 pools and disposals', () => {
    render(<TaxCalculations taxCalculations={mockZeroTaxCalculations} />);
    
    // Should not show section 104 pools section
    expect(screen.queryByText('Section 104 Pools')).not.toBeInTheDocument();
    
    // Should not show disposal calculations section
    expect(screen.queryByText('Share Disposals')).not.toBeInTheDocument();
  });

  it('shows limited disposal calculations with overflow message', () => {
    const manyDisposalsCalculations: TaxCalculation = {
      ...mockTaxCalculations,
      disposal_calculations: [
        ...mockTaxCalculations.disposal_calculations,
        ...Array(5).fill(null).map((_, i) => ({
          symbol: `STOCK${i}`,
          disposal_date: `2024-04-${10 + i}`,
          quantity: 10,
          gain_loss: 100,
          proceeds: 1000
        }))
      ]
    };

    render(<TaxCalculations taxCalculations={manyDisposalsCalculations} />);
    
    // Should show overflow message
    expect(screen.getByText(/... and 3 more disposals/)).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <TaxCalculations 
        taxCalculations={mockTaxCalculations} 
        className="custom-class" 
      />
    );
    
    expect(container.firstChild).toHaveClass('tax-calculations', 'custom-class');
  });
});