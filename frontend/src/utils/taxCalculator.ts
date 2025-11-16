/**
 * Comprehensive UK Tax Calculator
 * Implements progressive tax calculations for all income types
 */

import {
  getTaxBands,
  findTaxBand,
  calculateAdjustedPersonalAllowance,
  calculateRemainingBasicRateBand,
  DIVIDEND_TAX_RATES_2024_25,
  CGT_RATES_2024_25,
  NI_RATES_2024_25,
  MARRIAGE_ALLOWANCE_2024_25,
  BLIND_PERSON_ALLOWANCE_2024_25,
  PERSONAL_SAVINGS_ALLOWANCE_BASIC,
  PERSONAL_SAVINGS_ALLOWANCE_HIGHER,
  TaxBand
} from './taxBands';

export interface TaxCalculationInput {
  // Employment
  grossSalary?: number;
  bonuses?: number;
  benefitsInKind?: number;
  payeTaxPaid?: number;
  niPaid?: number;
  employeePensionContributions?: number;

  // Dividends
  portfolioDividends?: number;
  otherDividends?: number;

  // Capital Gains
  portfolioCapitalGains?: number;
  propertyCapitalGains?: number;
  otherCapitalGains?: number;

  // Other Income
  rentalIncome?: number;
  rentalExpenses?: number;
  savingsInterest?: number;
  selfEmploymentIncome?: number;

  // Personal Details
  region: 'england-wales-ni' | 'scotland';
  claimMarriageAllowance?: boolean;
  claimBlindPersonAllowance?: boolean;
  carriedForwardLosses?: number;
}

export interface IncomeTaxBreakdown {
  totalIncome: number;
  personalAllowance: number;
  marriageAllowance: number;
  blindPersonAllowance: number;
  taxableIncome: number;
  taxByBand: Array<{
    band: string;
    income: number;
    rate: number;
    tax: number;
  }>;
  totalTax: number;
  marginalRate: number;
  effectiveRate: number;
}

export interface DividendTaxBreakdown {
  totalDividends: number;
  dividendAllowance: number;
  taxableDividends: number;
  taxAtBasicRate: number;
  taxAtHigherRate: number;
  taxAtAdditionalRate: number;
  totalTax: number;
}

export interface CapitalGainsTaxBreakdown {
  totalGains: number;
  annualExemption: number;
  carriedForwardLosses: number;
  taxableGains: number;
  sharesGains: number;
  sharesGainsTax: number;
  propertyGains: number;
  propertyGainsTax: number;
  otherGains: number;
  otherGainsTax: number;
  totalTax: number;
}

export interface NationalInsuranceBreakdown {
  earnings: number;
  niableEarnings: number;
  class1AtStandardRate: number;
  class1AtAdditionalRate: number;
  totalNI: number;
}

export interface ComprehensiveTaxCalculation {
  incomeTax: IncomeTaxBreakdown;
  dividendTax: DividendTaxBreakdown;
  capitalGainsTax: CapitalGainsTaxBreakdown;
  nationalInsurance: NationalInsuranceBreakdown;
  totalTaxLiability: number;
  totalNILiability: number;
  combinedLiability: number;
  summary: {
    totalIncome: number;
    totalTaxableIncome: number;
    totalTax: number;
    totalNI: number;
    netIncome: number;
  };
}

/**
 * Calculate Income Tax on employment and other non-dividend, non-capital-gains income
 */
export const calculateIncomeTax = (
  income: number,
  region: 'england-wales-ni' | 'scotland',
  pensionContributions: number = 0,
  claimMarriageAllowance: boolean = false,
  claimBlindPersonAllowance: boolean = false
): IncomeTaxBreakdown => {
  const bands = getTaxBands(region);
  
  // Calculate allowances
  const personalAllowance = calculateAdjustedPersonalAllowance(income);
  const marriageAllowance = claimMarriageAllowance ? MARRIAGE_ALLOWANCE_2024_25 : 0;
  const blindPersonAllowance = claimBlindPersonAllowance ? BLIND_PERSON_ALLOWANCE_2024_25 : 0;
  
  // Income after pension relief (pension contributions are deducted before tax)
  const incomeAfterPension = Math.max(0, income - pensionContributions);
  
  // Total allowances
  const totalAllowances = personalAllowance + marriageAllowance + blindPersonAllowance;
  
  // Taxable income
  const taxableIncome = Math.max(0, incomeAfterPension - totalAllowances);
  
  // Calculate tax by band
  const taxByBand: Array<{ band: string; income: number; rate: number; tax: number }> = [];
  let remainingIncome = taxableIncome;
  let totalTax = 0;
  
  // Skip the personal allowance band (0% tax) and calculate for other bands
  for (let i = 1; i < bands.length; i++) {
    const band = bands[i];
    const previousBand = bands[i - 1];
    
    const bandStart = band.threshold - (personalAllowance > 0 ? personalAllowance : 0);
    const bandEnd = band.upperLimit ? band.upperLimit - (personalAllowance > 0 ? personalAllowance : 0) : Infinity;
    const bandWidth = bandEnd - bandStart;
    
    if (remainingIncome <= 0) break;
    
    const incomeInBand = Math.min(remainingIncome, bandWidth);
    const taxInBand = incomeInBand * band.rate;
    
    if (incomeInBand > 0) {
      taxByBand.push({
        band: band.name,
        income: incomeInBand,
        rate: band.rate,
        tax: taxInBand
      });
      
      totalTax += taxInBand;
      remainingIncome -= incomeInBand;
    }
  }
  
  // Find marginal rate
  const marginalBand = findTaxBand(incomeAfterPension, bands);
  const marginalRate = marginalBand.rate;
  
  // Calculate effective rate
  const effectiveRate = incomeAfterPension > 0 ? totalTax / incomeAfterPension : 0;
  
  return {
    totalIncome: income,
    personalAllowance,
    marriageAllowance,
    blindPersonAllowance,
    taxableIncome,
    taxByBand,
    totalTax,
    marginalRate,
    effectiveRate
  };
};

/**
 * Calculate Dividend Tax
 */
export const calculateDividendTax = (
  totalDividends: number,
  nonDividendIncome: number,
  region: 'england-wales-ni' | 'scotland'
): DividendTaxBreakdown => {
  const { allowance, basicRate, higherRate, additionalRate } = DIVIDEND_TAX_RATES_2024_25;
  
  // Apply dividend allowance
  const taxableDividends = Math.max(0, totalDividends - allowance);
  
  if (taxableDividends === 0) {
    return {
      totalDividends,
      dividendAllowance: Math.min(totalDividends, allowance),
      taxableDividends: 0,
      taxAtBasicRate: 0,
      taxAtHigherRate: 0,
      taxAtAdditionalRate: 0,
      totalTax: 0
    };
  }
  
  // Calculate how much basic rate band is remaining after non-dividend income
  const remainingBasicBand = calculateRemainingBasicRateBand(nonDividendIncome, region);
  
  let taxAtBasicRate = 0;
  let taxAtHigherRate = 0;
  let taxAtAdditionalRate = 0;
  let remainingDividends = taxableDividends;
  
  // Tax dividends in the basic rate band
  if (remainingBasicBand > 0 && remainingDividends > 0) {
    const dividendsAtBasicRate = Math.min(remainingDividends, remainingBasicBand);
    taxAtBasicRate = dividendsAtBasicRate * basicRate;
    remainingDividends -= dividendsAtBasicRate;
  }
  
  // Tax dividends in the higher rate band
  // For England/Wales/NI: between £50,270 and £125,140
  // For Scotland: between £43,662 and £125,140
  const higherRateLimit = region === 'scotland' ? (125140 - 43662) : (125140 - 50270);
  
  if (remainingDividends > 0) {
    const dividendsAtHigherRate = Math.min(remainingDividends, higherRateLimit);
    taxAtHigherRate = dividendsAtHigherRate * higherRate;
    remainingDividends -= dividendsAtHigherRate;
  }
  
  // Tax remaining dividends at additional rate
  if (remainingDividends > 0) {
    taxAtAdditionalRate = remainingDividends * additionalRate;
  }
  
  const totalTax = taxAtBasicRate + taxAtHigherRate + taxAtAdditionalRate;
  
  return {
    totalDividends,
    dividendAllowance: allowance,
    taxableDividends,
    taxAtBasicRate,
    taxAtHigherRate,
    taxAtAdditionalRate,
    totalTax
  };
};

/**
 * Calculate Capital Gains Tax
 */
export const calculateCapitalGainsTax = (
  sharesGains: number,
  propertyGains: number,
  otherGains: number,
  nonGainsIncome: number,
  region: 'england-wales-ni' | 'scotland',
  carriedForwardLosses: number = 0
): CapitalGainsTaxBreakdown => {
  const { annualExemption, basicRateShares, higherRateShares, basicRateProperty, higherRateProperty } =
    CGT_RATES_2024_25;
  
  const totalGains = sharesGains + propertyGains + otherGains;
  
  // Apply annual exemption and carried forward losses
  const gainsAfterExemption = Math.max(0, totalGains - annualExemption);
  const taxableGains = Math.max(0, gainsAfterExemption - carriedForwardLosses);
  
  if (taxableGains === 0) {
    return {
      totalGains,
      annualExemption: Math.min(totalGains, annualExemption),
      carriedForwardLosses: Math.min(gainsAfterExemption, carriedForwardLosses),
      taxableGains: 0,
      sharesGains: 0,
      sharesGainsTax: 0,
      propertyGains: 0,
      propertyGainsTax: 0,
      otherGains: 0,
      otherGainsTax: 0,
      totalTax: 0
    };
  }
  
  // Calculate how much basic rate band is remaining
  const remainingBasicBand = calculateRemainingBasicRateBand(nonGainsIncome, region);
  
  // Proportion gains by type
  const gainsRatio = totalGains > 0 ? taxableGains / totalGains : 0;
  const taxableSharesGains = sharesGains * gainsRatio;
  const taxablePropertyGains = propertyGains * gainsRatio;
  const taxableOtherGains = otherGains * gainsRatio;
  
  // Calculate tax for shares
  let sharesGainsTax = 0;
  if (taxableSharesGains > 0) {
    const sharesInBasicBand = Math.min(taxableSharesGains, remainingBasicBand);
    const sharesInHigherBand = Math.max(0, taxableSharesGains - sharesInBasicBand);
    
    sharesGainsTax =
      sharesInBasicBand * basicRateShares + sharesInHigherBand * higherRateShares;
  }
  
  // Calculate tax for property
  let propertyGainsTax = 0;
  if (taxablePropertyGains > 0) {
    const propertyInBasicBand = Math.min(
      taxablePropertyGains,
      Math.max(0, remainingBasicBand - taxableSharesGains)
    );
    const propertyInHigherBand = Math.max(0, taxablePropertyGains - propertyInBasicBand);
    
    propertyGainsTax =
      propertyInBasicBand * basicRateProperty + propertyInHigherBand * higherRateProperty;
  }
  
  // Calculate tax for other gains (use shares rates)
  let otherGainsTax = 0;
  if (taxableOtherGains > 0) {
    const otherInBasicBand = Math.min(
      taxableOtherGains,
      Math.max(0, remainingBasicBand - taxableSharesGains - taxablePropertyGains)
    );
    const otherInHigherBand = Math.max(0, taxableOtherGains - otherInBasicBand);
    
    otherGainsTax =
      otherInBasicBand * basicRateShares + otherInHigherBand * higherRateShares;
  }
  
  return {
    totalGains,
    annualExemption,
    carriedForwardLosses,
    taxableGains,
    sharesGains: taxableSharesGains,
    sharesGainsTax,
    propertyGains: taxablePropertyGains,
    propertyGainsTax,
    otherGains: taxableOtherGains,
    otherGainsTax,
    totalTax: sharesGainsTax + propertyGainsTax + otherGainsTax
  };
};

/**
 * Calculate National Insurance contributions
 */
export const calculateNationalInsurance = (earnings: number): NationalInsuranceBreakdown => {
  const { primaryThreshold, upperEarningsLimit, standardRate, additionalRate } = NI_RATES_2024_25;
  
  const niableEarnings = Math.max(0, earnings - primaryThreshold);
  
  if (niableEarnings === 0) {
    return {
      earnings,
      niableEarnings: 0,
      class1AtStandardRate: 0,
      class1AtAdditionalRate: 0,
      totalNI: 0
    };
  }
  
  // Calculate NI at standard rate (up to upper earnings limit)
  const earningsAtStandardRate = Math.min(niableEarnings, upperEarningsLimit - primaryThreshold);
  const class1AtStandardRate = earningsAtStandardRate * standardRate;
  
  // Calculate NI at additional rate (above upper earnings limit)
  const earningsAboveUEL = Math.max(0, earnings - upperEarningsLimit);
  const class1AtAdditionalRate = earningsAboveUEL * additionalRate;
  
  const totalNI = class1AtStandardRate + class1AtAdditionalRate;
  
  return {
    earnings,
    niableEarnings,
    class1AtStandardRate,
    class1AtAdditionalRate,
    totalNI
  };
};

/**
 * Main comprehensive tax calculation function
 */
export const calculateComprehensiveTax = (
  input: TaxCalculationInput
): ComprehensiveTaxCalculation => {
  // Calculate employment income
  const employmentIncome =
    (input.grossSalary || 0) + (input.bonuses || 0) + (input.benefitsInKind || 0);
  
  // Calculate rental income (after expenses and property allowance)
  const PROPERTY_ALLOWANCE = 1000;
  const rentalIncome = input.rentalIncome || 0;
  const rentalExpenses = input.rentalExpenses || 0;
  const netRentalIncome = Math.max(
    0,
    Math.max(rentalIncome - rentalExpenses, rentalIncome - PROPERTY_ALLOWANCE)
  );
  
  // Calculate savings interest (subject to personal savings allowance)
  const savingsInterest = input.savingsInterest || 0;
  
  // Total non-dividend, non-capital-gains income
  const nonDividendIncome =
    employmentIncome + netRentalIncome + savingsInterest + (input.selfEmploymentIncome || 0);
  
  // Calculate Income Tax
  const incomeTax = calculateIncomeTax(
    nonDividendIncome,
    input.region,
    input.employeePensionContributions || 0,
    input.claimMarriageAllowance,
    input.claimBlindPersonAllowance
  );
  
  // Calculate Dividend Tax
  const totalDividends = (input.portfolioDividends || 0) + (input.otherDividends || 0);
  const dividendTax = calculateDividendTax(totalDividends, nonDividendIncome, input.region);
  
  // Calculate Capital Gains Tax
  const capitalGainsTax = calculateCapitalGainsTax(
    input.portfolioCapitalGains || 0,
    input.propertyCapitalGains || 0,
    input.otherCapitalGains || 0,
    nonDividendIncome,
    input.region,
    input.carriedForwardLosses || 0
  );
  
  // Calculate National Insurance
  const nationalInsurance = calculateNationalInsurance(employmentIncome);
  
  // Calculate totals
  const totalTaxLiability = incomeTax.totalTax + dividendTax.totalTax + capitalGainsTax.totalTax;
  const totalNILiability = nationalInsurance.totalNI;
  const combinedLiability = totalTaxLiability + totalNILiability;
  
  const totalIncome = nonDividendIncome + totalDividends + capitalGainsTax.totalGains;
  const totalTaxableIncome =
    incomeTax.taxableIncome + dividendTax.taxableDividends + capitalGainsTax.taxableGains;
  const netIncome = totalIncome - combinedLiability;
  
  return {
    incomeTax,
    dividendTax,
    capitalGainsTax,
    nationalInsurance,
    totalTaxLiability,
    totalNILiability,
    combinedLiability,
    summary: {
      totalIncome,
      totalTaxableIncome,
      totalTax: totalTaxLiability,
      totalNI: totalNILiability,
      netIncome
    }
  };
};
