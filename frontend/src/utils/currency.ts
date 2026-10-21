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

export function getCurrencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency] || `${currency} `;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Math.abs(amount));
}

export function formatDualCurrency(
  amount: number,
  currency: string,
  gbpAmount: number
): string {
  if (currency === 'GBP') {
    return `£${formatCurrency(amount)}`;
  }
  const symbol = getCurrencySymbol(currency);
  return `${symbol}${formatCurrency(amount)} (£${formatCurrency(gbpAmount)})`;
}
