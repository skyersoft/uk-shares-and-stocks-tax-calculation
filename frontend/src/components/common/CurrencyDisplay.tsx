import React from 'react';
import { formatCurrency, getCurrencySymbol } from '../../utils/currency';

interface CurrencyDisplayProps {
  amount: number;
  currency: string;
  gbpAmount?: number;
  showSymbol?: boolean;
  className?: string;
}

export const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({ 
  amount, 
  currency, 
  gbpAmount, 
  showSymbol = true,
  className = ''
}) => {
  const symbol = getCurrencySymbol(currency);
  const formatted = formatCurrency(amount);
  const isNegative = amount < 0;
  
  if (currency === 'GBP' || !gbpAmount || Math.abs(amount - gbpAmount) < 0.01) {
    return (
      <span className={`currency-display ${isNegative ? 'text-danger' : ''} ${className}`}>
        {isNegative && '- '}
        {showSymbol && symbol}
        {formatted}
      </span>
    );
  }
  
  return (
    <span className={`currency-display dual ${isNegative ? 'text-danger' : ''} ${className}`}>
      <span className="original">
        {isNegative && '- '}
        {showSymbol && symbol}
        {formatted}
      </span>
      <span className="converted text-muted small ms-1">
        (£{formatCurrency(gbpAmount)})
      </span>
    </span>
  );
};
