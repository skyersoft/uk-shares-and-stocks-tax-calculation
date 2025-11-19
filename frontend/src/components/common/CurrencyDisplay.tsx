import React from 'react';

interface CurrencyDisplayProps {
  amount: number;
  currency: string;
  gbpAmount?: number;
  showSymbol?: boolean;
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

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Math.abs(amount));
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
