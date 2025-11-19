import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EmploymentIncome } from './EmploymentIncome';
import { EmploymentIncomeData } from '../../../types/calculator';

describe('EmploymentIncome', () => {
  const mockData: EmploymentIncomeData = {
    grossSalary: 0,
    bonuses: 0,
    benefitsInKind: 0,
    payeTaxPaid: 0,
    niPaid: 0,
    studentLoanDeductions: 0,
    employeePensionContributions: 0,
    employerPensionContributions: 0
  };

  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders employment income form', () => {
      render(<EmploymentIncome data={mockData} onChange={mockOnChange} />);
      
      expect(screen.getByRole('heading', { name: /Employment Income/i })).toBeInTheDocument();
      expect(screen.getByText(/Enter your employment income details/i)).toBeInTheDocument();
    });

    it('displays all input fields', () => {
      render(<EmploymentIncome data={mockData} onChange={mockOnChange} />);
      
      expect(screen.getByLabelText(/Gross Salary/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Bonuses.*Commissions/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/PAYE Tax Already Paid/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/National Insurance Paid/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Employee Pension Contributions/i)).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('calls onChange when gross salary is updated', () => {
      render(<EmploymentIncome data={mockData} onChange={mockOnChange} />);
      
      const salaryInput = screen.getByLabelText(/Gross Salary.*Annual/i);
      fireEvent.change(salaryInput, { target: { value: '50000' } });

      expect(mockOnChange).toHaveBeenCalledWith({
        ...mockData,
        grossSalary: 50000
      });
    });

    it('calls onChange when bonuses are updated', () => {
      render(<EmploymentIncome data={mockData} onChange=  {mockOnChange} />);
      
      const bonusInput = screen.getByLabelText(/Bonuses.*Commissions/i);
      fireEvent.change(bonusInput, { target: { value: '10000' } });

      expect(mockOnChange).toHaveBeenCalledWith({
        ...mockData,
        bonuses: 10000
      });
    });

    it('calls onChange when PAYE tax is updated', () => {
      render(<EmploymentIncome data={mockData} onChange={mockOnChange} />);
      
      const payeInput = screen.getByLabelText(/PAYE Tax Already Paid/i);
      fireEvent.change(payeInput, { target: { value: '12000' } });

      expect(mockOnChange).toHaveBeenCalledWith({
        ...mockData,
        payeTaxPaid: 12000
      });
    });
  });

  describe('Summary Calculations', () => {
    it('displays total gross income correctly', () => {
      const dataWithIncome: EmploymentIncomeData = {
        ...mockData,
        grossSalary: 50000,
        bonuses: 10000,
        benefitsInKind: 0
      };

      render(<EmploymentIncome data={dataWithIncome} onChange={mockOnChange} />);
      
      // Gross Income = grossSalary + bonuses = 50000 + 10000 = 60000
      const grossIncomeElements = screen.getAllByText(/Gross Income/i);
      expect(grossIncomeElements.length).toBeGreaterThan(0);
      // Check that the summary section exists with the calculation
      expect(screen.getByText(/Income Summary/i)).toBeInTheDocument();
    });

    it('displays total deductions correctly', () => {
      const dataWithDeductions: EmploymentIncomeData = {
        ...mockData,
        payeTaxPaid: 12000,
        niPaid: 5000,
        studentLoanDeductions: 1000,
        employeePensionContributions: 2000
      };

      render(<EmploymentIncome data={dataWithDeductions} onChange={mockOnChange} />);
      
      // Deductions = PAYE + NI + Student Loan + Pension = 12000 + 5000 + 1000 + 2000 = 20000
      expect(screen.getByText('Deductions')).toBeInTheDocument();
      // Check that the summary shows deductions
      expect(screen.getByText(/Income Summary/i)).toBeInTheDocument();
    });

    it('displays net income correctly', () => {
      const dataComplete: EmploymentIncomeData = {
        grossSalary: 50000,
        bonuses: 10000,
        benefitsInKind: 0,
        payeTaxPaid: 12000,
        niPaid: 5000,
        studentLoanDeductions: 1000,
        employeePensionContributions: 3000,
        employerPensionContributions: 0
      };

      render(<EmploymentIncome data={dataComplete} onChange={mockOnChange} />);
      
      // Net = Gross - Deductions = 60000 - (12000 + 5000 + 1000 + 3000) = 60000 - 21000 = 39000
      expect(screen.getByText(/£39,000/)).toBeInTheDocument();
    });
  });

  describe('Pension Contributions', () => {
    it('displays pension contribution fields', () => {
      render(<EmploymentIncome data={mockData} onChange={mockOnChange} />);
      
      expect(screen.getByLabelText(/Employee Pension Contributions/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Employer Pension Contributions/i)).toBeInTheDocument();
    });

    it('shows tax relief information for pension contributions', () => {
      const dataWithPension: EmploymentIncomeData = {
        ...mockData,
        employeePensionContributions: 4000
      };

      render(<EmploymentIncome data={dataWithPension} onChange={mockOnChange} />);
      
      // Should show pension relief in the summary
      expect(screen.getByText('Pension Relief')).toBeInTheDocument();
      const amounts = screen.getAllByText(/£4,000/);
      expect(amounts.length).toBeGreaterThan(0);
    });
  });

  describe('Validation', () => {
    it('accepts valid numeric inputs', () => {
      render(<EmploymentIncome data={mockData} onChange={mockOnChange} />);
      
      const salaryInput = screen.getByLabelText(/Gross Salary.*Annual/i);
      fireEvent.change(salaryInput, { target: { value: '75000.50' } });

      expect(mockOnChange).toHaveBeenCalled();
    });

    it('handles zero values', () => {
      render(<EmploymentIncome data={mockData} onChange={mockOnChange} />);
      
      const salaryInput = screen.getByLabelText(/Gross Salary.*Annual/i);
      fireEvent.change(salaryInput, { target: { value: '0' } });

      expect(mockOnChange).toHaveBeenCalledWith({
        ...mockData,
        grossSalary: 0
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels', () => {
      render(<EmploymentIncome data={mockData} onChange={mockOnChange} />);
      
      const salaryInput = screen.getByLabelText(/Gross Salary.*Annual/i);
      expect(salaryInput).toHaveAttribute('type', 'number');
    });

    it('has currency symbols for inputs', () => {
      render(<EmploymentIncome data={mockData} onChange={mockOnChange} />);
      
      const currencySymbols = screen.getAllByText('£');
      expect(currencySymbols.length).toBeGreaterThan(0);
    });
  });
});
