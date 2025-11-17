import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RentalIncome } from './RentalIncome';
import { RentalIncomeData } from '../../../types/calculator';

describe('RentalIncome', () => {
  const mockData: RentalIncomeData = {
    grossRentalIncome: 0,
    mortgageInterest: 0,
    repairsCosts: 0,
    agentFees: 0,
    otherExpenses: 0,
    usePropertyAllowance: false
  };

  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders rental income form', () => {
      render(<RentalIncome data={mockData} onChange={mockOnChange} />);
      
      expect(screen.getByRole('heading', { name: /Rental Income/i, level: 5 })).toBeInTheDocument();
      expect(screen.getByText(/Enter your rental income details/i)).toBeInTheDocument();
    });

    it('shows property allowance option', () => {
      render(<RentalIncome data={mockData} onChange={mockOnChange} />);
      
      // Check that property allowance checkbox exists by finding any checkbox
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThan(0);
    });
  });

  describe('Property Allowance Toggle', () => {
    it('shows expense fields when property allowance is not used', () => {
      render(<RentalIncome data={mockData} onChange={mockOnChange} />);
      
      expect(screen.getByLabelText(/Mortgage Interest/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Repairs.*Maintenance/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Agent.*Management Fees/i)).toBeInTheDocument();
    });

    it('hides expense fields when property allowance is enabled', () => {
      const dataWithAllowance: RentalIncomeData = {
        ...mockData,
        usePropertyAllowance: true
      };

      render(<RentalIncome data={dataWithAllowance} onChange={mockOnChange} />);
      
      expect(screen.queryByLabelText(/Mortgage Interest/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/Repairs & Maintenance/i)).not.toBeInTheDocument();
    });

    it('calls onChange when property allowance is toggled', () => {
      render(<RentalIncome data={mockData} onChange={mockOnChange} />);
      
      const checkbox = screen.getByLabelText(/Use Property Allowance/i);
      fireEvent.click(checkbox);

      expect(mockOnChange).toHaveBeenCalledWith({
        ...mockData,
        usePropertyAllowance: true
      });
    });
  });

  describe('Expense Calculations', () => {
    it('calculates total expenses correctly', () => {
      const dataWithExpenses: RentalIncomeData = {
        ...mockData,
        grossRentalIncome: 15000,
        mortgageInterest: 3000,
        repairsCosts: 1000,
        agentFees: 500,
        otherExpenses: 500
      };

      render(<RentalIncome data={dataWithExpenses} onChange={mockOnChange} />);
      
      // Total expenses: 5000
      expect(screen.getByText(/£5,000/)).toBeInTheDocument();
    });

    it('shows best method recommendation', () => {
      const { rerender } = render(
        <RentalIncome 
          data={{ 
            ...mockData, 
            repairsCosts: 500,
            agentFees: 200,
            otherExpenses: 100,
            usePropertyAllowance: false 
          }} 
          onChange={mockOnChange} 
        />
      );
      
      // Total expenses = 500 + 200 + 100 = 800, so property allowance (£1000) is better
      expect(screen.getByText(/Property Allowance.*more beneficial/i)).toBeInTheDocument();
      
      rerender(
        <RentalIncome 
          data={{ 
            ...mockData, 
            repairsCosts: 800,
            agentFees: 400,
            otherExpenses: 300,
            usePropertyAllowance: false 
          }} 
          onChange={mockOnChange} 
        />
      );
      
      // Total expenses = 800 + 400 + 300 = 1500, so actual expenses are better
      expect(screen.getByText(/Claiming actual expenses.*more beneficial/i)).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('updates gross rental income', () => {
      render(<RentalIncome data={mockData} onChange={mockOnChange} />);
      
      const input = screen.getByLabelText(/Gross Rental Income/i);
      fireEvent.change(input, { target: { value: '12000' } });

      expect(mockOnChange).toHaveBeenCalledWith({
        ...mockData,
        grossRentalIncome: 12000
      });
    });

    it('updates mortgage interest', () => {
      render(<RentalIncome data={mockData} onChange={mockOnChange} />);
      
      const input = screen.getByLabelText(/Mortgage Interest/i);
      fireEvent.change(input, { target: { value: '3000' } });

      expect(mockOnChange).toHaveBeenCalledWith({
        ...mockData,
        mortgageInterest: 3000
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels', () => {
      render(<RentalIncome data={mockData} onChange={mockOnChange} />);
      
      expect(screen.getByLabelText(/Gross Rental Income/i)).toBeInTheDocument();
    });

    it('has currency symbols', () => {
      render(<RentalIncome data={mockData} onChange={mockOnChange} />);
      
      const currencySymbols = screen.getAllByText('£');
      expect(currencySymbols.length).toBeGreaterThan(0);
    });
  });
});
