import React, { useState, useMemo } from 'react';
import { DisposalEvent } from '../../types/calculation';
import { CurrencyDisplay } from '../common/CurrencyDisplay';
import { MatchingRuleBadge } from '../common/MatchingRuleBadge';

interface DisposalDetailsTableProps {
  disposalEvents: DisposalEvent[];
  className?: string;
}

type SortField = keyof DisposalEvent;
type SortOrder = 'asc' | 'desc';

export const DisposalDetailsTable: React.FC<DisposalDetailsTableProps> = ({ 
  disposalEvents,
  className = ''
}) => {
  const [sortField, setSortField] = useState<SortField>('disposal_date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  
  const sortedEvents = useMemo(() => {
    return [...disposalEvents].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      
      if (aVal === bVal) return 0;
      if (aVal === null) return 1;
      if (bVal === null) return -1;
      
      const comparison = aVal > bVal ? 1 : -1;
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [disposalEvents, sortField, sortOrder]);
  
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };
  
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };
  
  if (!disposalEvents || disposalEvents.length === 0) {
    return null;
  }
  
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <i className="bi bi-arrow-down-up text-muted ms-1 small"></i>;
    }
    return (
      <i className={`bi bi-arrow-${sortOrder === 'asc' ? 'up' : 'down'} ms-1 small`}></i>
    );
  };
  
  return (
    <div className={`disposal-details-table card shadow-sm ${className}`}>
      <div className="card-header bg-primary text-white">
        <h5 className="mb-0">
          <i className="bi bi-list-check me-2"></i>
          Detailed Disposal Breakdown
        </h5>
        <small className="text-white-50">
          {disposalEvents.length} disposal{disposalEvents.length !== 1 ? 's' : ''} with FX tracking
        </small>
      </div>
      
      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table table-hover table-sm mb-0">
            <thead className="table-light">
              <tr>
                <th 
                  onClick={() => handleSort('disposal_date')}
                  style={{ cursor: 'pointer' }}
                  className="text-nowrap"
                >
                  Date
                  <SortIcon field="disposal_date" />
                </th>
                <th 
                  onClick={() => handleSort('security_symbol')}
                  style={{ cursor: 'pointer' }}
                >
                  Security
                  <SortIcon field="security_symbol" />
                </th>
                <th 
                  onClick={() => handleSort('quantity')}
                  style={{ cursor: 'pointer' }}
                  className="text-end"
                >
                  Qty
                  <SortIcon field="quantity" />
                </th>
                <th className="text-end">Cost</th>
                <th className="text-end">Proceeds</th>
                <th className="text-end">Commission</th>
                <th 
                  onClick={() => handleSort('fx_gain_loss')}
                  style={{ cursor: 'pointer' }}
                  className="text-end"
                >
                  FX Gain/Loss
                  <SortIcon field="fx_gain_loss" />
                </th>
                <th 
                  onClick={() => handleSort('cgt_gain_loss')}
                  style={{ cursor: 'pointer' }}
                  className="text-end"
                >
                  CGT Gain/Loss
                  <SortIcon field="cgt_gain_loss" />
                </th>
                <th 
                  onClick={() => handleSort('total_gain_loss')}
                  style={{ cursor: 'pointer' }}
                  className="text-end"
                >
                  Total
                  <SortIcon field="total_gain_loss" />
                </th>
                <th>Matching Rule</th>
              </tr>
            </thead>
            <tbody>
              {sortedEvents.map((event) => (
                <tr key={event.disposal_id}>
                  <td className="text-nowrap">
                    {formatDate(event.disposal_date)}
                  </td>
                  <td>
                    <div className="fw-bold">{event.security_symbol}</div>
                    <small className="text-muted">{event.security_name}</small>
                    {event.security_country && (
                      <span className="badge bg-light text-dark ms-1 small">
                        {event.security_country}
                      </span>
                    )}
                  </td>
                  <td className="text-end">
                    {event.quantity.toLocaleString('en-GB', { 
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 4 
                    })}
                  </td>
                  <td className="text-end">
                    <CurrencyDisplay
                      amount={event.cost_original_amount}
                      currency={event.cost_original_currency}
                      gbpAmount={event.cost_gbp}
                    />
                    {event.cost_original_currency !== 'GBP' && (
                      <small className="d-block text-muted">
                        @ {event.cost_fx_rate.toFixed(4)}
                      </small>
                    )}
                  </td>
                  <td className="text-end">
                    <CurrencyDisplay
                      amount={event.proceeds_original_amount}
                      currency={event.proceeds_original_currency}
                      gbpAmount={event.proceeds_gbp}
                    />
                    {event.proceeds_original_currency !== 'GBP' && (
                      <small className="d-block text-muted">
                        @ {event.proceeds_fx_rate.toFixed(4)}
                      </small>
                    )}
                  </td>
                  <td className="text-end text-muted small">
                    £{(event.cost_commission + event.proceeds_commission).toFixed(2)}
                  </td>
                  <td className={`text-end fw-bold ${
                    event.fx_gain_loss > 0 ? 'text-success' : 
                    event.fx_gain_loss < 0 ? 'text-danger' : 
                    'text-muted'
                  }`}>
                    {event.fx_gain_loss >= 0 ? '+' : ''}
                    £{event.fx_gain_loss.toFixed(2)}
                  </td>
                  <td className={`text-end fw-bold ${
                    event.cgt_gain_loss > 0 ? 'text-success' : 
                    event.cgt_gain_loss < 0 ? 'text-danger' : 
                    'text-muted'
                  }`}>
                    {event.cgt_gain_loss >= 0 ? '+' : ''}
                    £{event.cgt_gain_loss.toFixed(2)}
                  </td>
                  <td className={`text-end fw-bold ${
                    event.total_gain_loss > 0 ? 'text-success' : 
                    event.total_gain_loss < 0 ? 'text-danger' : 
                    'text-muted'
                  }`}>
                    {event.total_gain_loss >= 0 ? '+' : ''}
                    £{event.total_gain_loss.toFixed(2)}
                  </td>
                  <td>
                    <MatchingRuleBadge rule={event.matching_rule} />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="table-light fw-bold">
              <tr>
                <td colSpan={6} className="text-end">Totals:</td>
                <td className={`text-end ${
                  disposalEvents.reduce((sum, e) => sum + e.fx_gain_loss, 0) >= 0 
                    ? 'text-success' : 'text-danger'
                }`}>
                  £{disposalEvents.reduce((sum, e) => sum + e.fx_gain_loss, 0).toFixed(2)}
                </td>
                <td className={`text-end ${
                  disposalEvents.reduce((sum, e) => sum + e.cgt_gain_loss, 0) >= 0 
                    ? 'text-success' : 'text-danger'
                }`}>
                  £{disposalEvents.reduce((sum, e) => sum + e.cgt_gain_loss, 0).toFixed(2)}
                </td>
                <td className={`text-end ${
                  disposalEvents.reduce((sum, e) => sum + e.total_gain_loss, 0) >= 0 
                    ? 'text-success' : 'text-danger'
                }`}>
                  £{disposalEvents.reduce((sum, e) => sum + e.total_gain_loss, 0).toFixed(2)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
      
      <div className="card-footer bg-light">
        <small className="text-muted">
          <i className="bi bi-info-circle me-1"></i>
          FX Gain/Loss represents foreign exchange gains/losses. CGT Gain/Loss is the pure capital gain excluding FX effects.
        </small>
      </div>
    </div>
  );
};
