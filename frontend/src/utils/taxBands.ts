/**
 * UK Tax Bands and Rates for 2024-2025 Tax Year
 * Based on official HMRC rates
 */

export interface TaxBand {
  name: string;
  threshold: number; // Lower threshold
  upperLimit: number | null; // Upper limit (null for highest band)
  rate: number; // Tax rate as decimal (e.g., 0.20 for 20%)
}

// England, Wales, and Northern Ireland
export const ENGLAND_WALES_NI_TAX_BANDS_2024_25: TaxBand[] = [
  {
    name: 'Personal Allowance',
    threshold: 0,
    upperLimit: 12570,
    rate: 0
  },
  {
    name: 'Basic Rate',
    threshold: 12571,
    upperLimit: 50270,
    rate: 0.20
  },
  {
    name: 'Higher Rate',
    threshold: 50271,
    upperLimit: 125140,
    rate: 0.40
  },
  {
    name: 'Additional Rate',
    threshold: 125141,
    upperLimit: null,
    rate: 0.45
  }
];

// Scotland
export const SCOTLAND_TAX_BANDS_2024_25: TaxBand[] = [
  {
    name: 'Personal Allowance',
    threshold: 0,
    upperLimit: 12570,
    rate: 0
  },
  {
    name: 'Starter Rate',
    threshold: 12571,
    upperLimit: 14876,
    rate: 0.19
  },
  {
    name: 'Basic Rate',
    threshold: 14877,
    upperLimit: 26561,
    rate: 0.20
  },
  {
    name: 'Intermediate Rate',
    threshold: 26562,
    upperLimit: 43662,
    rate: 0.21
  },
  {
    name: 'Higher Rate',
    threshold: 43663,
    upperLimit: 125140,
    rate: 0.42
  },
  {
    name: 'Top Rate',
    threshold: 125141,
    upperLimit: null,
    rate: 0.47
  }
];

// Dividend Tax Rates
export interface DividendTaxRates {
  allowance: number;
  basicRate: number;
  higherRate: number;
  additionalRate: number;
}

export const DIVIDEND_TAX_RATES_2024_25: DividendTaxRates = {
  allowance: 500,
  basicRate: 0.0875, // 8.75%
  higherRate: 0.3375, // 33.75%
  additionalRate: 0.3935 // 39.35%
};

// Capital Gains Tax
export interface CapitalGainsTaxRates {
  annualExemption: number;
  basicRateShares: number; // For basic rate taxpayers
  higherRateShares: number; // For higher/additional rate taxpayers
  basicRateProperty: number; // Residential property - basic rate
  higherRateProperty: number; // Residential property - higher rate
}

export const CGT_RATES_2024_25: CapitalGainsTaxRates = {
  annualExemption: 3000,
  basicRateShares: 0.10, // 10%
  higherRateShares: 0.20, // 20%
  basicRateProperty: 0.18, // 18%
  higherRateProperty: 0.24 // 24%
};

// National Insurance Rates (for employees)
export interface NationalInsuranceRates {
  lowerEarningsLimit: number;
  primaryThreshold: number;
  upperEarningsLimit: number;
  standardRate: number; // Between primary threshold and upper earnings limit
  additionalRate: number; // Above upper earnings limit
}

export const NI_RATES_2024_25: NationalInsuranceRates = {
  lowerEarningsLimit: 6396, // Annual
  primaryThreshold: 12570, // Annual (aligned with personal allowance)
  upperEarningsLimit: 50270, // Annual
  standardRate: 0.12, // 12%
  additionalRate: 0.02 // 2%
};

// Allowances
export const PERSONAL_ALLOWANCE_2024_25 = 12570;
export const MARRIAGE_ALLOWANCE_2024_25 = 1260;
export const BLIND_PERSON_ALLOWANCE_2024_25 = 3070;
export const PERSONAL_SAVINGS_ALLOWANCE_BASIC = 1000;
export const PERSONAL_SAVINGS_ALLOWANCE_HIGHER = 500;
export const PROPERTY_ALLOWANCE = 1000;
export const TRADING_ALLOWANCE = 1000;

/**
 * Calculate adjusted personal allowance (tapers above £100,000)
 * Reduces by £1 for every £2 of income above £100,000
 */
export const calculateAdjustedPersonalAllowance = (totalIncome: number): number => {
  const TAPER_THRESHOLD = 100000;
  const TAPER_RATE = 0.5; // Lose £1 for every £2 over threshold

  if (totalIncome <= TAPER_THRESHOLD) {
    return PERSONAL_ALLOWANCE_2024_25;
  }

  const reduction = Math.floor((totalIncome - TAPER_THRESHOLD) * TAPER_RATE);
  const adjustedAllowance = Math.max(0, PERSONAL_ALLOWANCE_2024_25 - reduction);

  return adjustedAllowance;
};

/**
 * Get tax bands for a specific region
 */
export const getTaxBands = (region: 'england-wales-ni' | 'scotland'): TaxBand[] => {
  return region === 'scotland' ? SCOTLAND_TAX_BANDS_2024_25 : ENGLAND_WALES_NI_TAX_BANDS_2024_25;
};

/**
 * Find which tax band an amount of income falls into
 */
export const findTaxBand = (income: number, bands: TaxBand[]): TaxBand => {
  for (let i = bands.length - 1; i >= 0; i--) {
    if (income >= bands[i].threshold) {
      return bands[i];
    }
  }
  return bands[0]; // Default to first band (Personal Allowance)
};

/**
 * Calculate how much of the basic rate band is remaining
 * Used for dividend and CGT calculations
 */
export const calculateRemainingBasicRateBand = (
  nonDividendIncome: number,
  region: 'england-wales-ni' | 'scotland'
): number => {
  // Find the upper limit of the highest basic-rate band
  // For England/Wales/NI: £50,270
  // For Scotland: £43,662 (top of Intermediate Rate, which is still < 40%)
  const basicRateUpperLimit = region === 'scotland' ? 43662 : 50270;
  
  const personalAllowance = calculateAdjustedPersonalAllowance(nonDividendIncome);
  const taxableIncome = Math.max(0, nonDividendIncome - personalAllowance);
  
  return Math.max(0, basicRateUpperLimit - personalAllowance - taxableIncome);
};
