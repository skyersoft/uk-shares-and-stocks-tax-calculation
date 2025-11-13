import React, { useState, useMemo, useCallback } from 'react';
import { TableColumn, TableProps, TableSortState, HoldingData, DividendData, DisposalData } from '../../types';
import { LoadingSpinner } from './LoadingSpinner';

// Utility function to get nested object values by path
const getNestedValue = (obj: any, path: any): any => {
  if (typeof path === 'function') {
    return path(obj);
  }
  
  if (typeof path === 'string') {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : '';
    }, obj);
  }
  
  // Handle symbol keys by converting to string
  if (typeof path === 'symbol' || typeof path === 'number') {
    return obj[path] || '';
  }
  
  return '';
};

// Utility function to sort data
const sortData = <T,>(data: T[], sortState: TableSortState, columns: TableColumn<T>[]): T[] => {
  if (!sortState.column || !sortState.direction) {
    return data;
  }

  const column = columns.find(col => col.key === sortState.column);
  if (!column || !column.accessor) {
    return data;
  }

  return [...data].sort((a, b) => {
    const aValue = getNestedValue(a, column.accessor!);
    const bValue = getNestedValue(b, column.accessor!);

    // Handle null/undefined values
    if (aValue == null && bValue == null) return 0;
    if (aValue == null) return sortState.direction === 'asc' ? -1 : 1;
    if (bValue == null) return sortState.direction === 'asc' ? 1 : -1;

    // Handle string vs number comparison
    const aString = String(aValue).toLowerCase();
    const bString = String(bValue).toLowerCase();
    
    // Try numeric comparison first
    const aNum = Number(aValue);
    const bNum = Number(bValue);
    
    if (!isNaN(aNum) && !isNaN(bNum)) {
      return sortState.direction === 'asc' ? aNum - bNum : bNum - aNum;
    }
    
    // String comparison
    if (aString < bString) return sortState.direction === 'asc' ? -1 : 1;
    if (aString > bString) return sortState.direction === 'asc' ? 1 : -1;
    return 0;
  });
};

// Utility function to paginate data
const paginateData = <T,>(data: T[], currentPage: number, pageSize: number): T[] => {
  const startIndex = currentPage * pageSize;
  const endIndex = startIndex + pageSize;
  return data.slice(startIndex, endIndex);
};

// Pagination Component
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange
}) => {
  if (totalPages <= 1) return null;

  const startItem = currentPage * pageSize + 1;
  const endItem = Math.min((currentPage + 1) * pageSize, totalItems);

  return (
    <nav aria-label="Table pagination" className="d-flex justify-content-between align-items-center mt-3">
      <div className="text-muted small">
        Showing {startItem} to {endItem} of {totalItems} entries
      </div>
      
      <ul className="pagination mb-0">
        <li className={`page-item ${currentPage === 0 ? 'disabled' : ''}`}>
          <button
            className="page-link"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 0}
            aria-label="Previous page"
          >
            <i className="fas fa-chevron-left" aria-hidden="true"></i>
          </button>
        </li>

        {/* Page numbers */}
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let pageNum;
          if (totalPages <= 5) {
            pageNum = i;
          } else if (currentPage < 3) {
            pageNum = i;
          } else if (currentPage > totalPages - 4) {
            pageNum = totalPages - 5 + i;
          } else {
            pageNum = currentPage - 2 + i;
          }

          return (
            <li key={pageNum} className={`page-item ${currentPage === pageNum ? 'active' : ''}`}>
              <button
                className="page-link"
                onClick={() => onPageChange(pageNum)}
                aria-label={`Go to page ${pageNum + 1}`}
              >
                {pageNum + 1}
              </button>
            </li>
          );
        })}

        <li className={`page-item ${currentPage === totalPages - 1 ? 'disabled' : ''}`}>
          <button
            className="page-link"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages - 1}
            aria-label="Next page"
          >
            <i className="fas fa-chevron-right" aria-hidden="true"></i>
          </button>
        </li>
      </ul>
    </nav>
  );
};

// Main Table Component
export const Table = <T,>({
  data,
  columns,
  loading = false,
  emptyMessage = 'No data available',
  size = 'md',
  striped = false,
  bordered = false,
  hover = false,
  responsive = true,
  sortable = false,
  defaultSort,
  onSort,
  pagination = false,
  paginationConfig,
  currentPage = 0,
  pageSize = 10,
  totalItems,
  onPageChange,
  onRowClick,
  rowClassName,
  className = '',
  children,
  'data-testid': dataTestId,
  ...props
}: TableProps<T>) => {
  // State for internal sorting
  const [internalSortState, setInternalSortState] = useState<TableSortState>(
    defaultSort || { column: null, direction: null }
  );

  // Use external sort state if provided, otherwise internal
  const currentSortState = onSort ? (defaultSort || { column: null, direction: null }) : internalSortState;

  // Handle sort clicks
  const handleSort = useCallback((columnKey: string) => {
    if (!sortable) return;

    const newDirection: 'asc' | 'desc' = 
      currentSortState.column === columnKey && currentSortState.direction === 'asc' 
        ? 'desc' 
        : 'asc';

    const newSortState: TableSortState = { column: columnKey, direction: newDirection };

    if (onSort) {
      onSort(newSortState);
    } else {
      setInternalSortState(newSortState);
    }
  }, [sortable, currentSortState, onSort]);

  // Process data (sorting and pagination)
  const processedData = useMemo(() => {
    let result = [...data];

    // Apply sorting
    if (sortable && (currentSortState.column && currentSortState.direction)) {
      result = sortData(result, currentSortState, columns);
    }

    // Apply pagination
    if (pagination) {
      result = paginateData(result, currentPage, pageSize);
    }

    return result;
  }, [data, currentSortState, columns, sortable, pagination, currentPage, pageSize]);

  // Calculate pagination info
  const totalPages = Math.ceil((totalItems || data.length) / pageSize);

  // Build table classes
  const tableClasses = [
    'table',
    size === 'sm' && 'table-sm',
    striped && 'table-striped',
    bordered && 'table-bordered',
    hover && 'table-hover'
  ].filter(Boolean).join(' ');

  const wrapperClasses = [
    responsive && 'table-responsive',
    loading && 'position-relative opacity-50',
    className
  ].filter(Boolean).join(' ');

  // Handle row clicks
  const handleRowClick = useCallback((record: T, index: number) => {
    if (onRowClick) {
      onRowClick(record, index);
    }
  }, [onRowClick]);

  // Get column alignment class
  const getAlignmentClass = (align?: 'left' | 'center' | 'right') => {
    switch (align) {
      case 'left': return 'text-start';
      case 'center': return 'text-center';
      case 'right': return 'text-end';
      default: return '';
    }
  };

  // Get sort icon
  const getSortIcon = (columnKey: string, sortable?: boolean) => {
    if (!sortable) return null;

    if (currentSortState.column === columnKey) {
      return currentSortState.direction === 'asc' 
        ? <i className="fas fa-sort-up ms-1" aria-hidden="true"></i>
        : <i className="fas fa-sort-down ms-1" aria-hidden="true"></i>;
    }
    
    return <i className="fas fa-sort ms-1 text-muted" aria-hidden="true"></i>;
  };

  // Get aria-sort value
  const getAriaSort = (columnKey: string) => {
    if (currentSortState.column === columnKey) {
      return currentSortState.direction === 'asc' ? 'ascending' : 'descending';
    }
    return undefined;
  };

  return (
    <div className={wrapperClasses} data-testid={dataTestId} {...props}>
      {loading && (
        <div className="position-absolute top-50 start-50 translate-middle" style={{ zIndex: 10 }}>
          <div role="status" aria-live="polite" aria-label="Loading table data">
            <LoadingSpinner size="lg" text="Loading data..." />
          </div>
        </div>
      )}

      <table className={tableClasses} role="table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={[
                  getAlignmentClass(column.align),
                  column.hiddenOnMobile && 'd-none d-md-table-cell',
                  column.sortable && sortable && 'user-select-none cursor-pointer'
                ].filter(Boolean).join(' ')}
                style={{ width: column.width }}
                onClick={() => column.sortable && handleSort(column.key)}
                aria-sort={getAriaSort(column.key)}
                role="columnheader"
              >
                {column.header}
                {getSortIcon(column.key, column.sortable && sortable)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {processedData.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="text-center text-muted py-4">
                {loading ? (
                  <div role="status" aria-live="polite" aria-label="Loading table content">
                    <LoadingSpinner size="sm" text="Loading..." />
                  </div>
                ) : (
                  emptyMessage
                )}
              </td>
            </tr>
          ) : (
            processedData.map((row, index) => {
              const rowClasses = [
                onRowClick && 'cursor-pointer',
                rowClassName && rowClassName(row, index)
              ].filter(Boolean).join(' ');

              return (
                <tr
                  key={index}
                  className={rowClasses}
                  onClick={() => handleRowClick(row, index)}
                  role="row"
                >
                  {columns.map((column) => {
                    const value = column.accessor ? getNestedValue(row, column.accessor) : '';
                    const cellContent = column.render ? column.render(value, row, index) : value;

                    return (
                      <td
                        key={column.key}
                        className={[
                          getAlignmentClass(column.align),
                          column.hiddenOnMobile && 'd-none d-md-table-cell'
                        ].filter(Boolean).join(' ')}
                        role="cell"
                      >
                        {cellContent}
                      </td>
                    );
                  })}
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {pagination && totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems || data.length}
          pageSize={pageSize}
          onPageChange={onPageChange || (() => {})}
        />
      )}
    </div>
  );
};

// Type-specific table components for better developer experience
export const HoldingsTable: React.FC<Omit<TableProps<HoldingData>, 'columns'> & { 
  columns?: TableColumn<HoldingData>[] 
}> = ({ columns, ...props }) => {
  const defaultColumns: TableColumn<HoldingData>[] = [
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
      render: (value: number) => value.toLocaleString('en-GB', { maximumFractionDigits: 0 })
    },
    {
      key: 'average_cost',
      header: 'Avg Cost',
      accessor: 'average_cost_gbp',
      sortable: true,
      align: 'right',
      render: (value: number) => `£${value.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`
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
      header: 'Unrealized Gain/Loss',
      accessor: 'unrealized_gain_loss',
      sortable: true,
      align: 'right',
      render: (value: number) => (
        <span className={value >= 0 ? 'text-success fw-semibold' : 'text-danger fw-semibold'}>
          {value >= 0 ? '+' : ''}£{value.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      key: 'return_pct',
      header: 'Return %',
      accessor: 'total_return_pct',
      sortable: true,
      align: 'right',
      render: (value?: number) =>
        typeof value === 'number'
          ? `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
          : '-'
    }
  ];

  return <Table<HoldingData> columns={columns || defaultColumns} {...props} />;
};

export const DividendsTable: React.FC<Omit<TableProps<DividendData>, 'columns'> & { 
  columns?: TableColumn<DividendData>[] 
}> = ({ columns, ...props }) => {
  const defaultColumns: TableColumn<DividendData>[] = [
    {
      key: 'payment_date',
      header: 'Payment Date',
      accessor: 'payment_date',
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString('en-GB')
    },
    {
      key: 'security',
      header: 'Security',
      accessor: (row: DividendData) => {
        const symbol = row.security.symbol;
        const name = row.security.name;
        if (name && name !== symbol) {
          return `${name} (${symbol})`;
        }
        return symbol;
      },
      sortable: true
    },
    {
      key: 'gross_amount',
      header: 'Gross Amount',
      accessor: 'amount_gbp',
      sortable: true,
      align: 'right',
      render: (value: number) => `£${value.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`
    },
    {
      key: 'withholding_tax',
      header: 'Withholding Tax',
      accessor: 'withholding_tax_gbp',
      sortable: true,
      align: 'right',
      hiddenOnMobile: true,
      render: (value?: number) =>
        typeof value === 'number' ? `£${value.toLocaleString('en-GB', { minimumFractionDigits: 2 })}` : '-'
    },
    {
      key: 'net_amount',
      header: 'Net Amount',
      accessor: (row: DividendData) => row.net_amount_gbp || (row.amount_gbp - (row.withholding_tax_gbp || 0)),
      sortable: true,
      align: 'right',
      render: (value: number) => (
        <span className="fw-semibold">
          £{value.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
        </span>
      )
    }
  ];

  return <Table<DividendData> columns={columns || defaultColumns} {...props} />;
};

export const DisposalsTable: React.FC<Omit<TableProps<DisposalData>, 'columns'> & { 
  columns?: TableColumn<DisposalData>[] 
}> = ({ columns, ...props }) => {
  const defaultColumns: TableColumn<DisposalData>[] = [
    {
      key: 'disposal_date',
      header: 'Date',
      accessor: 'disposal_date',
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString('en-GB')
    },
    {
      key: 'symbol',
      header: 'Symbol',
      accessor: (row: DisposalData) => row.security.symbol,
      sortable: true,
      width: '120px'
    },
    {
      key: 'quantity',
      header: 'Quantity',
      accessor: 'quantity',
      sortable: true,
      align: 'right',
      render: (value: number) => value.toLocaleString('en-GB', { maximumFractionDigits: 0 })
    },
    {
      key: 'proceeds',
      header: 'Proceeds',
      accessor: 'proceeds',
      sortable: true,
      align: 'right',
      render: (value: number) => `£${value.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`
    },
    {
      key: 'cost_basis',
      header: 'Cost Basis',
      accessor: 'cost_basis',
      sortable: true,
      align: 'right',
      hiddenOnMobile: true,
      render: (value: number) => `£${value.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`
    },
    {
      key: 'gain_loss',
      header: 'Gain/Loss',
      accessor: 'gain_or_loss',
      sortable: true,
      align: 'right',
      render: (value: number) => (
        <span className={value >= 0 ? 'text-success fw-semibold' : 'text-danger fw-semibold'}>
          {value >= 0 ? '+' : ''}£{value.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
        </span>
      )
    }
  ];

  return <Table<DisposalData> columns={columns || defaultColumns} {...props} />;
};

export default Table;
