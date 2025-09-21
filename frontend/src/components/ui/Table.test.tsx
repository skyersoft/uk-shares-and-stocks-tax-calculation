import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../__tests__/utils/test-utils';
import { Table } from './Table';
import { TableColumn, HoldingData, DividendData } from '../../types';

// Test utilities
const mockHoldingsData: HoldingData[] = [
  {
    security: { symbol: 'AAPL', name: 'Apple Inc.' },
    quantity: 100,
    average_cost_gbp: 150.00,
    current_value_gbp: 18000.00,
    total_cost_gbp: 15000.00,
    unrealized_gain_loss: 3000.00,
    total_return_pct: 20.00
  },
  {
    security: { symbol: 'MSFT', name: 'Microsoft Corporation' },
    quantity: 50,
    average_cost_gbp: 200.00,
    current_value_gbp: 12000.00,
    total_cost_gbp: 10000.00,
    unrealized_gain_loss: 2000.00,
    total_return_pct: 20.00
  },
  {
    security: { symbol: 'GOOGL', name: 'Alphabet Inc.' },
    quantity: 25,
    average_cost_gbp: 2000.00,
    current_value_gbp: 62500.00,
    total_cost_gbp: 50000.00,
    unrealized_gain_loss: 12500.00,
    total_return_pct: 25.00
  }
];

const holdingsColumns: TableColumn<HoldingData>[] = [
  {
    key: 'symbol',
    header: 'Symbol',
    accessor: (row: HoldingData) => row.security.symbol,
    sortable: true,
    width: '120px'
  },
  {
    key: 'quantity',
    header: 'Quantity',
    accessor: 'quantity',
    sortable: true,
    align: 'right',
    render: (value: number) => value.toFixed(0)
  },
  {
    key: 'current_value',
    header: 'Current Value',
    accessor: 'current_value_gbp',
    sortable: true,
    align: 'right',
    render: (value: number) => `£${value.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`
  },
  {
    key: 'gain_loss',
    header: 'Gain/Loss',
    accessor: 'unrealized_gain_loss',
    sortable: true,
    align: 'right',
    render: (value: number, row: HoldingData) => (
      <span className={value >= 0 ? 'text-success' : 'text-danger'}>
        £{value.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
        {row.total_return_pct && (
          <small className="d-block">
            ({row.total_return_pct > 0 ? '+' : ''}{row.total_return_pct.toFixed(2)}%)
          </small>
        )}
      </span>
    )
  }
];

const simpleColumns: TableColumn<{id: number, name: string, value: number}>[] = [
  {
    key: 'id',
    header: 'ID',
    accessor: 'id',
    sortable: true
  },
  {
    key: 'name',
    header: 'Name',
    accessor: 'name',
    sortable: true
  },
  {
    key: 'value',
    header: 'Value',
    accessor: 'value',
    sortable: true,
    align: 'right'
  }
];

describe('Table Component', () => {
  // Basic rendering tests
  describe('Basic Rendering', () => {
    it('renders empty table with message when no data provided', () => {
      renderWithProviders(
        <Table
          data={[]}
          columns={simpleColumns}
          emptyMessage="No data available"
        />
      );

      expect(screen.getByText('No data available')).toBeInTheDocument();
    });

    it('renders table with data and columns', () => {
      const data = [
        { id: 1, name: 'Item 1', value: 100 },
        { id: 2, name: 'Item 2', value: 200 }
      ];

      renderWithProviders(<Table data={data} columns={simpleColumns} />);

      // Check headers
      expect(screen.getByText('ID')).toBeInTheDocument();
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Value')).toBeInTheDocument();

      // Check data
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      renderWithProviders(
        <Table
          data={[]}
          columns={simpleColumns}
          className="custom-table"
          data-testid="test-table"
        />
      );

      const table = screen.getByTestId('test-table');
      expect(table).toHaveClass('custom-table');
    });

    it('renders responsive table by default', () => {
      renderWithProviders(
        <Table
          data={[]}
          columns={simpleColumns}
          data-testid="test-table"
        />
      );

      const tableWrapper = screen.getByTestId('test-table');
      expect(tableWrapper).toHaveClass('table-responsive');
    });
  });

  // Bootstrap styling tests
  describe('Bootstrap Styling', () => {
    it('applies striped styling when enabled', () => {
      renderWithProviders(
        <Table
          data={[{ id: 1, name: 'Item 1', value: 100 }]}
          columns={simpleColumns}
          striped
          data-testid="test-table"
        />
      );

      const table = screen.getByRole('table');
      expect(table).toHaveClass('table-striped');
    });

    it('applies bordered styling when enabled', () => {
      renderWithProviders(
        <Table
          data={[{ id: 1, name: 'Item 1', value: 100 }]}
          columns={simpleColumns}
          bordered
          data-testid="test-table"
        />
      );

      const table = screen.getByRole('table');
      expect(table).toHaveClass('table-bordered');
    });

    it('applies hover styling when enabled', () => {
      renderWithProviders(
        <Table
          data={[{ id: 1, name: 'Item 1', value: 100 }]}
          columns={simpleColumns}
          hover
          data-testid="test-table"
        />
      );

      const table = screen.getByRole('table');
      expect(table).toHaveClass('table-hover');
    });

    it('applies size variants correctly', () => {
      const { rerender } = renderWithProviders(
        <Table
          data={[{ id: 1, name: 'Item 1', value: 100 }]}
          columns={simpleColumns}
          size="sm"
          data-testid="test-table"
        />
      );

      let table = screen.getByRole('table');
      expect(table).toHaveClass('table-sm');

      rerender(
        <Table
          data={[{ id: 1, name: 'Item 1', value: 100 }]}
          columns={simpleColumns}
          size="lg"
          data-testid="test-table"
        />
      );

      table = screen.getByRole('table');
      expect(table).not.toHaveClass('table-sm');
      // Note: Bootstrap doesn't have table-lg, so no class should be added
    });
  });

  // Column rendering tests
  describe('Column Rendering', () => {
    it('renders column headers correctly', () => {
      renderWithProviders(<Table data={[]} columns={simpleColumns} />);

      expect(screen.getByText('ID')).toBeInTheDocument();
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Value')).toBeInTheDocument();
    });

    it('applies column alignment classes', () => {
      const columnsWithAlignment: TableColumn[] = [
        { key: 'left', header: 'Left', align: 'left' },
        { key: 'center', header: 'Center', align: 'center' },
        { key: 'right', header: 'Right', align: 'right' }
      ];

      renderWithProviders(
        <Table
          data={[{ left: 'L', center: 'C', right: 'R' }]}
          columns={columnsWithAlignment}
        />
      );

      const headers = screen.getAllByRole('columnheader');
      expect(headers[0]).toHaveClass('text-start'); // left alignment
      expect(headers[1]).toHaveClass('text-center'); // center alignment  
      expect(headers[2]).toHaveClass('text-end'); // right alignment
    });

    it('uses custom render function when provided', () => {
      renderWithProviders(<Table data={mockHoldingsData} columns={holdingsColumns} />);

      // Check that currency formatting is applied
      expect(screen.getByText('£18,000.00')).toBeInTheDocument();
      expect(screen.getByText('£12,000.00')).toBeInTheDocument();

      // Check that gain/loss has color coding
      const gainElements = screen.getAllByText(/£\d+,\d+\.\d+/);
      expect(gainElements.length).toBeGreaterThan(0);
    });

    it('handles accessor functions', () => {
      renderWithProviders(<Table data={mockHoldingsData} columns={holdingsColumns} />);

      // Should access security.symbol correctly via function accessor
      expect(screen.getByText('AAPL')).toBeInTheDocument();
      expect(screen.getByText('MSFT')).toBeInTheDocument();
      expect(screen.getByText('GOOGL')).toBeInTheDocument();
    });
  });

  // Sorting functionality tests
  describe('Sorting Functionality', () => {
    it('shows sort indicators on sortable columns', () => {
      renderWithProviders(<Table data={mockHoldingsData} columns={holdingsColumns} sortable />);

      const symbolHeader = screen.getByText('Symbol');
      const quantityHeader = screen.getByText('Quantity');
      
      expect(symbolHeader.closest('th')).toContainHTML('fa-sort');
      expect(quantityHeader.closest('th')).toContainHTML('fa-sort');
    });

    it('handles column header clicks for sorting', async () => {
      const user = userEvent.setup();
      const onSort = jest.fn();

      renderWithProviders(
        <Table
          data={mockHoldingsData}
          columns={holdingsColumns}
          sortable
          onSort={onSort}
        />
      );

      const symbolHeader = screen.getByText('Symbol');
      await user.click(symbolHeader);

      expect(onSort).toHaveBeenCalledWith({
        column: 'symbol',
        direction: 'asc'
      });
    });

    it('toggles sort direction on repeated clicks', async () => {
      const user = userEvent.setup();
      const onSort = jest.fn();

      renderWithProviders(
        <Table
          data={mockHoldingsData}
          columns={holdingsColumns}
          sortable
          onSort={onSort}
          defaultSort={{ column: 'symbol', direction: 'asc' }}
        />
      );

      const symbolHeader = screen.getByText('Symbol');
      await user.click(symbolHeader);

      expect(onSort).toHaveBeenCalledWith({
        column: 'symbol',
        direction: 'desc'
      });
    });

    it('shows correct sort direction indicators', () => {
      renderWithProviders(
        <Table
          data={mockHoldingsData}
          columns={holdingsColumns}
          sortable
          defaultSort={{ column: 'symbol', direction: 'asc' }}
        />
      );

      const symbolHeader = screen.getByText('Symbol');
      expect(symbolHeader.closest('th')).toContainHTML('fa-sort-up');
    });
  });

  // Loading state tests
  describe('Loading State', () => {
    it('shows loading spinner when loading is true', () => {
      renderWithProviders(
        <Table
          data={[]}
          columns={simpleColumns}
          loading
        />
      );

      expect(screen.getByText('Loading data...')).toBeInTheDocument();
      expect(screen.getAllByRole('status')).toHaveLength(2); // Both overlay and table body spinners
    });

    it('disables interactions during loading', () => {
      renderWithProviders(
        <Table
          data={mockHoldingsData}
          columns={holdingsColumns}
          loading
          sortable
        />
      );

      const table = screen.getByRole('table');
      expect(table.closest('.table-responsive')).toHaveClass('opacity-50');
    });
  });

  // Row interaction tests
  describe('Row Interactions', () => {
    it('handles row clicks when onRowClick provided', async () => {
      const user = userEvent.setup();
      const onRowClick = jest.fn();

      renderWithProviders(
        <Table
          data={mockHoldingsData}
          columns={holdingsColumns}
          onRowClick={onRowClick}
        />
      );

      const firstRow = screen.getByText('AAPL').closest('tr');
      if (firstRow) {
        await user.click(firstRow);
        expect(onRowClick).toHaveBeenCalledWith(mockHoldingsData[0], 0);
      }
    });

    it('applies custom row className', () => {
      const rowClassName = (record: HoldingData, index: number) => 
        record.unrealized_gain_loss >= 0 ? 'table-success' : 'table-danger';

      renderWithProviders(
        <Table
          data={mockHoldingsData}
          columns={holdingsColumns}
          rowClassName={rowClassName}
        />
      );

      const rows = screen.getAllByRole('row');
      // Skip header row
      const dataRows = rows.slice(1);
      
      dataRows.forEach(row => {
        expect(row).toHaveClass(/table-(success|danger)/);
      });
    });
  });

  // Responsive design tests
  describe('Responsive Design', () => {
    it('hides columns marked as hiddenOnMobile on small screens', () => {
      const columnsWithHidden: TableColumn[] = [
        { key: 'id', header: 'ID', accessor: 'id' },
        { key: 'name', header: 'Name', accessor: 'name' },
        { key: 'details', header: 'Details', accessor: 'details', hiddenOnMobile: true }
      ];

      renderWithProviders(
        <Table
          data={[{ id: 1, name: 'Item 1', details: 'Some details' }]}
          columns={columnsWithHidden}
        />
      );

      const detailsHeader = screen.getByText('Details');
      expect(detailsHeader.closest('th')).toHaveClass('d-none', 'd-md-table-cell');
    });
  });

  // Error handling tests
  describe('Error Handling', () => {
    it('handles empty data gracefully', () => {
      renderWithProviders(
        <Table
          data={[]}
          columns={simpleColumns}
          emptyMessage="No records found"
        />
      );

      expect(screen.getByText('No records found')).toBeInTheDocument();
    });

    it('handles invalid accessor paths gracefully', () => {
      const columnsWithInvalidAccessor: TableColumn[] = [
        { key: 'invalid', header: 'Invalid', accessor: 'non.existent.path' as any }
      ];

      expect(() => {
        renderWithProviders(
          <Table
            data={[{ id: 1, name: 'Test' }]}
            columns={columnsWithInvalidAccessor}
          />
        );
      }).not.toThrow();
    });
  });

  // Accessibility tests
  describe('Accessibility', () => {
    it('has proper table structure with headers', () => {
      renderWithProviders(<Table data={mockHoldingsData} columns={holdingsColumns} />);

      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();

      const headers = screen.getAllByRole('columnheader');
      expect(headers).toHaveLength(holdingsColumns.length);
    });

    it('provides proper ARIA labels for sorting', () => {
      renderWithProviders(
        <Table
          data={mockHoldingsData}
          columns={holdingsColumns}
          sortable
          defaultSort={{ column: 'symbol', direction: 'asc' }}
        />
      );

      const symbolHeader = screen.getByText('Symbol');
      expect(symbolHeader.closest('th')).toHaveAttribute('aria-sort', 'ascending');
    });

    it('has proper loading state announcements', () => {
      renderWithProviders(
        <Table
          data={[]}
          columns={simpleColumns}
          loading
        />
      );

      const loadingIndicators = screen.getAllByRole('status');
      expect(loadingIndicators.length).toBeGreaterThan(0);
      
      // Check aria-live attribute on one of the status elements
      const mainLoadingIndicator = screen.getByLabelText('Loading table data');
      expect(mainLoadingIndicator).toHaveAttribute('aria-live', 'polite');
    });
  });
});