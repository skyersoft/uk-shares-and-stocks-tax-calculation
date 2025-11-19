import React from 'react';

interface CurrencyBalance {
  currency: string;
  balance: number;
  balance_gbp: number;
  fx_rate: number;
}

interface CashBalancesTableProps {
  currencyBalances?: CurrencyBalance[];
  className?: string;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CHF: 'CHF ',
  CAD: 'C$',
  AUD: 'A$',
  HKD: 'HK$',
  SGD: 'S$'
};

function getCurrencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency] || currency + ' ';
}

export const CashBalancesTable: React.FC<CashBalancesTableProps> = ({
  currencyBalances,
  className = ''
}) => {
  if (!currencyBalances || currencyBalances.length === 0) {
    return null;
  }

  const totalGBP = currencyBalances.reduce((sum, cb) => sum + cb.balance_gbp, 0);
  
  return (
    <div className={`cash-balances-table card shadow-sm ${className}`}>
      <div className="card-header bg-success text-white">
        <h5 className="mb-0">
          <i className="bi bi-wallet2 me-2"></i>
          Cash Balances
        </h5>
        <small className="text-white-50">
          Current cash positions across currencies
        </small>
      </div>
      
      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table table-hover table-sm mb-0">
            <thead className="table-light">
              <tr>
                <th>Currency</th>
                <th className="text-end">Balance</th>
                <th className="text-end">FX Rate</th>
                <th className="text-end">GBP Value</th>
              </tr>
            </thead>
            <tbody>
              {currencyBalances.map((cb) => (
                <tr key={cb.currency}>
                  <td>
                    <span className="fw-bold">{cb.currency}</span>
                  </td>
                  <td className="text-end">
                    {getCurrencySymbol(cb.currency)}
                    {cb.balance.toLocaleString('en-GB', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </td>
                  <td className="text-end text-muted small">
                    {cb.currency !== 'GBP' ? cb.fx_rate.toFixed(4) : '-'}
                  </td>
                  <td className="text-end fw-bold">
                    £{cb.balance_gbp.toLocaleString('en-GB', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="table-light fw-bold">
              <tr>
                <td colSpan={3} className="text-end">Total (GBP):</td>
                <td className="text-end text-success">
                  £{totalGBP.toLocaleString('en-GB', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
      
      <div className="card-footer bg-light">
        <small className="text-muted">
          <i className="bi bi-info-circle me-1"></i>
          Cash balances are calculated from completed transactions and may not reflect pending settlements.
        </small>
      </div>
    </div>
  );
};
