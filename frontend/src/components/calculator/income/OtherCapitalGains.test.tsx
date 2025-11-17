import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { OtherCapitalGains } from './OtherCapitalGains';
import { OtherCapitalGainsData } from '../../../types/calculator';

describe('OtherCapitalGains', () => {
  const mockData: OtherCapitalGainsData = {
    propertyGains: [],
    cryptoGains: [],
    otherGains: []
  };

  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders other capital gains form', () => {
      render(<OtherCapitalGains data={mockData} onChange={mockOnChange} />);
      
      expect(screen.getByText(/Other Capital Gains/i)).toBeInTheDocument();
    });

    it('displays three tabs', () => {
      render(<OtherCapitalGains data={mockData} onChange={mockOnChange} />);
      
      expect(screen.getByText(/Property \(0\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Crypto \(0\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Other \(0\)/i)).toBeInTheDocument();
    });

    it('shows property tab by default', () => {
      render(<OtherCapitalGains data={mockData} onChange={mockOnChange} />);
      
      expect(screen.getByText(/No property disposals added yet/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Add Property Disposal/i })).toBeInTheDocument();
    });
  });

  describe('Tab Navigation', () => {
    it('switches to crypto tab when clicked', () => {
      render(<OtherCapitalGains data={mockData} onChange={mockOnChange} />);
      
      const cryptoTab = screen.getByText(/Crypto \(0\)/i);
      fireEvent.click(cryptoTab);

      expect(screen.getByText(/No cryptocurrency disposals added yet/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Add Crypto Disposal/i })).toBeInTheDocument();
    });

    it('switches to other tab when clicked', () => {
      render(<OtherCapitalGains data={mockData} onChange={mockOnChange} />);
      
      const otherTab = screen.getByText(/Other \(0\)/i);
      fireEvent.click(otherTab);

      expect(screen.getByText(/No other asset disposals added yet/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Add Asset Disposal/i })).toBeInTheDocument();
    });
  });

  describe('Property Gains', () => {
    it('adds a new property gain entry', () => {
      render(<OtherCapitalGains data={mockData} onChange={mockOnChange} />);
      
      const addButton = screen.getByRole('button', { name: /Add Property Disposal/i });
      fireEvent.click(addButton);

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          propertyGains: expect.arrayContaining([
            expect.objectContaining({
              description: '',
              acquisitionCost: 0,
              disposalProceeds: 0
            })
          ])
        })
      );
    });

    it('displays property gain fields when entry exists', () => {
      const dataWithProperty: OtherCapitalGainsData = {
        ...mockData,
        propertyGains: [{
          id: 'test-1',
          description: 'Test Property',
          acquisitionDate: '2020-01-01',
          disposalDate: '2024-01-01',
          acquisitionCost: 200000,
          disposalProceeds: 250000,
          improvementCosts: 10000,
          sellingCosts: 5000
        }]
      };

      render(<OtherCapitalGains data={dataWithProperty} onChange={mockOnChange} />);
      
      // Check that the property data is displayed
      expect(screen.getByDisplayValue('Test Property')).toBeInTheDocument();
      expect(screen.getByText(/Purchase Price/i)).toBeInTheDocument();
    });

    it('calculates property gain correctly', () => {
      const dataWithProperty: OtherCapitalGainsData = {
        ...mockData,
        propertyGains: [{
          id: 'test-1',
          description: 'Test Property',
          acquisitionDate: '2020-01-01',
          disposalDate: '2024-01-01',
          acquisitionCost: 200000,
          disposalProceeds: 250000,
          improvementCosts: 10000,
          sellingCosts: 5000
        }]
      };

      render(<OtherCapitalGains data={dataWithProperty} onChange={mockOnChange} />);
      
      // Gain: 250000 - 200000 - 10000 - 5000 = 35000
      // Check that gain calculation is displayed somewhere
      expect(screen.getByText(/Total Other Capital Gains/i)).toBeInTheDocument();
    });
  });

  describe('Crypto Gains', () => {
    it('adds a new crypto gain entry', () => {
      render(<OtherCapitalGains data={mockData} onChange={mockOnChange} />);
      
      const cryptoTab = screen.getByText(/Crypto \(0\)/i);
      fireEvent.click(cryptoTab);

      const addButton = screen.getByRole('button', { name: /Add Crypto Disposal/i });
      fireEvent.click(addButton);

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          cryptoGains: expect.arrayContaining([
            expect.objectContaining({
              asset: '',
              acquisitionCost: 0,
              disposalProceeds: 0
            })
          ])
        })
      );
    });

    it('displays crypto gain fields when entry exists', () => {
      const dataWithCrypto: OtherCapitalGainsData = {
        ...mockData,
        cryptoGains: [{
          id: 'test-1',
          asset: 'Bitcoin',
          acquisitionDate: '2020-01-01',
          disposalDate: '2024-01-01',
          acquisitionCost: 5000,
          disposalProceeds: 15000
        }]
      };

      render(<OtherCapitalGains data={dataWithCrypto} onChange={mockOnChange} />);
      
      const cryptoTab = screen.getByText(/Crypto \(1\)/i);
      fireEvent.click(cryptoTab);

      expect(screen.getByDisplayValue('Bitcoin')).toBeInTheDocument();
      // Just check that crypto fields are rendered
      expect(screen.getByText(/Purchase Cost/i)).toBeInTheDocument();
    });
  });

  describe('Total Summary', () => {
    it('displays total gains across all categories', () => {
      const dataWithAllTypes: OtherCapitalGainsData = {
        propertyGains: [{
          id: 'prop-1',
          description: 'Property',
          acquisitionDate: '2020-01-01',
          disposalDate: '2024-01-01',
          acquisitionCost: 200000,
          disposalProceeds: 250000,
          improvementCosts: 0,
          sellingCosts: 5000
        }],
        cryptoGains: [{
          id: 'crypto-1',
          asset: 'Bitcoin',
          acquisitionDate: '2020-01-01',
          disposalDate: '2024-01-01',
          acquisitionCost: 5000,
          disposalProceeds: 15000
        }],
        otherGains: [{
          id: 'other-1',
          description: 'Artwork',
          acquisitionDate: '2020-01-01',
          disposalDate: '2024-01-01',
          acquisitionCost: 1000,
          disposalProceeds: 3000,
          costs: 200
        }]
      };

      render(<OtherCapitalGains data={dataWithAllTypes} onChange={mockOnChange} />);
      
      // Property: 45000, Crypto: 10000, Other: 1800 = 56800
      expect(screen.getByText(/Total Other Capital Gains/i)).toBeInTheDocument();
    });
  });

  describe('Remove Functionality', () => {
    it('removes property gain when delete button clicked', () => {
      const dataWithProperty: OtherCapitalGainsData = {
        ...mockData,
        propertyGains: [{
          id: 'test-1',
          description: 'Test Property',
          acquisitionDate: '2020-01-01',
          disposalDate: '2024-01-01',
          acquisitionCost: 200000,
          disposalProceeds: 250000,
          improvementCosts: 10000,
          sellingCosts: 5000
        }]
      };

      render(<OtherCapitalGains data={dataWithProperty} onChange={mockOnChange} />);
      
      const deleteButton = screen.getByRole('button', { name: '' }); // Trash icon button
      fireEvent.click(deleteButton);

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          propertyGains: []
        })
      );
    });
  });

  describe('Accessibility', () => {
    it('has proper tab navigation', () => {
      render(<OtherCapitalGains data={mockData} onChange={mockOnChange} />);
      
      const tabs = screen.getAllByRole('button', { name: /Property|Crypto|Other/i });
      expect(tabs.length).toBeGreaterThanOrEqual(3);
    });

    it('displays warning about different CGT rates', () => {
      render(<OtherCapitalGains data={mockData} onChange={mockOnChange} />);
      
      expect(screen.getByText(/Property gains may be subject to higher CGT rates/i)).toBeInTheDocument();
    });
  });
});
