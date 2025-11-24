import { WizardData } from '../types/calculator';
import { NormalizedResults } from '../types/calculation';

interface TaxBands {
    personalAllowance: number;
    basicRateLimit: number;
    higherRateLimit: number;
    basicRate: number;
    higherRate: number;
    additionalRate: number;
}

interface TaxBreakdown {
    basicRateAmount: number;
    basicRateTax: number;
    higherRateAmount: number;
    higherRateTax: number;
    additionalRateAmount: number;
    additionalRateTax: number;
    total: number;
}

export interface ComprehensiveTaxCalculation {
    // Income breakdown
    employmentIncome: number;
    rentalIncome: number;
    savingsInterest: number;
    dividendsFromPortfolio: number;
    otherDividends: number;
    totalDividends: number;
    totalIncome: number;

    // Capital gains breakdown (separate property from other)
    gainsFromPortfolio: number;
    propertyGains: number;
    cryptoGains: number;
    otherCapitalGains: number;
    totalNonPropertyGains: number; // Portfolio + crypto + other
    totalCapitalGains: number; // All gains including property

    // Deductions
    personalAllowance: number;
    marriageAllowance: number;
    blindPersonAllowance: number;
    charitableDonations: number;
    carriedForwardLosses: number;
    cgtAnnualExemption: number;
    dividendAllowance: number;
    savingsAllowance: number;

    // Taxable amounts
    taxableEmploymentIncome: number;
    taxableRentalIncome: number;
    taxableSavingsInterest: number;
    taxableDividends: number;
    taxableNonPropertyGains: number;
    taxablePropertyGains: number;

    // Tax calculations with breakdowns
    incomeTax: number;
    incomeTaxBreakdown: TaxBreakdown;
    dividendTax: number;
    dividendTaxBreakdown: TaxBreakdown;
    capitalGainsTax: number; // Non-property gains
    capitalGainsTaxBreakdown: TaxBreakdown;
    propertyGainsTax: number; // Property gains (different rates)
    propertyGainsTaxBreakdown: TaxBreakdown;
    totalTaxLiability: number;

    // Tax already paid
    payeTaxPaid: number;
    niPaid: number;

    // Final amount
    taxOwedOrRefund: number;
}

function roundToTwoDecimals(num: number): number {
    return Math.round(num * 100) / 100;
}

export function calculateComprehensiveTax(
    normalizedResults: NormalizedResults,
    wizardData: WizardData | null,
    taxYear: string
): ComprehensiveTaxCalculation {
    // Get tax bands for the year
    const taxBands = getTaxBands(taxYear, wizardData?.personalDetails?.taxResidency || 'england-wales-ni');
    const { cgtAllowance, dividendAllowance, savingsAllowance } = getAllowances(taxYear);

    // === INCOME BREAKDOWN ===
    const employmentIncome = roundToTwoDecimals((wizardData?.employmentIncome?.grossSalary || 0) +
        (wizardData?.employmentIncome?.bonuses || 0) +
        (wizardData?.employmentIncome?.benefitsInKind || 0));

    const grossRentalIncome = wizardData?.rentalIncome?.grossRentalIncome || 0;
    const rentalExpenses = (wizardData?.rentalIncome?.mortgageInterest || 0) +
        (wizardData?.rentalIncome?.repairsCosts || 0) +
        (wizardData?.rentalIncome?.agentFees || 0) +
        (wizardData?.rentalIncome?.otherExpenses || 0);
    const rentalIncome = roundToTwoDecimals(wizardData?.rentalIncome?.usePropertyAllowance
        ? Math.max(0, grossRentalIncome - 1000)
        : Math.max(0, grossRentalIncome - rentalExpenses));

    const savingsInterest = roundToTwoDecimals(wizardData?.savingsInterest?.totalInterest || 0);

    const dividendsFromPortfolio = roundToTwoDecimals(normalizedResults.dividends.reduce(
        (sum, d) => sum + (d.grossAmount || 0), 0
    ));
    const otherDividends = roundToTwoDecimals((wizardData?.otherDividends?.ukDividends || 0) +
        (wizardData?.otherDividends?.foreignDividends || 0));
    const totalDividends = roundToTwoDecimals(dividendsFromPortfolio + otherDividends);

    const totalIncome = roundToTwoDecimals(employmentIncome + rentalIncome + savingsInterest);

    // === CAPITAL GAINS BREAKDOWN ===
    const gainsFromPortfolio = roundToTwoDecimals(normalizedResults.disposals.reduce(
        (sum, d) => sum + (d.gainLoss || 0), 0
    ));

    // Separate property gains (they have different tax rates: 18%/28%)
    let propertyGains = 0;
    let cryptoGains = 0;
    let otherCapitalGains = 0;

    if (wizardData?.otherCapitalGains) {
        propertyGains = roundToTwoDecimals(wizardData.otherCapitalGains.propertyGains?.reduce((sum, g) =>
            sum + (g.disposalProceeds - g.acquisitionCost - g.improvementCosts - g.sellingCosts), 0
        ) || 0);

        cryptoGains = roundToTwoDecimals(wizardData.otherCapitalGains.cryptoGains?.reduce((sum, g) =>
            sum + (g.disposalProceeds - g.acquisitionCost), 0
        ) || 0);

        otherCapitalGains = roundToTwoDecimals(wizardData.otherCapitalGains.otherGains?.reduce((sum, g) =>
            sum + (g.disposalProceeds - g.acquisitionCost - g.costs), 0
        ) || 0);
    }

    const totalNonPropertyGains = roundToTwoDecimals(gainsFromPortfolio + cryptoGains + otherCapitalGains);
    const totalCapitalGains = roundToTwoDecimals(totalNonPropertyGains + propertyGains);

    // === DEDUCTIONS ===
    const carriedForwardLosses = roundToTwoDecimals(wizardData?.personalDetails?.carriedForwardLosses || 0);
    const charitableDonations = roundToTwoDecimals(wizardData?.personalDetails?.charitableDonations || 0);

    // Personal allowance (reduced if income > £100k)
    let personalAllowance = taxBands.personalAllowance;
    if (totalIncome > 100000) {
        personalAllowance = Math.max(0, personalAllowance - Math.floor((totalIncome - 100000) / 2));
    }

    const marriageAllowance = wizardData?.personalDetails?.claimMarriageAllowance ? 1260 : 0;
    const blindPersonAllowance = wizardData?.personalDetails?.claimBlindPersonAllowance ? 2870 : 0;

    // === TAXABLE AMOUNTS ===
    const taxableIncome = Math.max(0, totalIncome - personalAllowance - blindPersonAllowance);

    // Determine savings allowance based on income
    let actualSavingsAllowance = savingsAllowance;
    if (taxableIncome > taxBands.higherRateLimit) {
        actualSavingsAllowance = 0;
    } else if (taxableIncome > taxBands.basicRateLimit) {
        actualSavingsAllowance = 500;
    }

    const taxableEmploymentIncome = roundToTwoDecimals(Math.max(0, employmentIncome - personalAllowance));
    const taxableRentalIncome = rentalIncome;
    const taxableSavingsInterest = roundToTwoDecimals(Math.max(0, savingsInterest - actualSavingsAllowance));
    const taxableDividends = roundToTwoDecimals(Math.max(0, totalDividends - dividendAllowance));

    // Split CGT allowance proportionally between property and non-property gains
    let allowanceForNonProperty = cgtAllowance;
    let allowanceForProperty = 0;

    if (totalCapitalGains > 0) {
        const nonPropertyRatio = totalNonPropertyGains / totalCapitalGains;
        allowanceForNonProperty = roundToTwoDecimals(cgtAllowance * nonPropertyRatio);
        allowanceForProperty = roundToTwoDecimals(cgtAllowance - allowanceForNonProperty);
    }

    // Apply losses to non-property gains first
    const taxableNonPropertyGains = roundToTwoDecimals(Math.max(0, totalNonPropertyGains - allowanceForNonProperty - carriedForwardLosses));
    const taxablePropertyGains = roundToTwoDecimals(Math.max(0, propertyGains - allowanceForProperty));

    // === TAX CALCULATIONS ===
    const incomeTaxBreakdown = calculateIncomeTaxWithBreakdown(
        taxableEmploymentIncome + taxableRentalIncome + taxableSavingsInterest,
        taxBands
    );
    const incomeTax = roundToTwoDecimals(incomeTaxBreakdown.total);

    const dividendTaxBreakdown = calculateDividendTaxWithBreakdown(taxableDividends, taxableIncome, taxBands);
    const dividendTax = roundToTwoDecimals(dividendTaxBreakdown.total);

    const capitalGainsTaxBreakdown = calculateCapitalGainsTaxWithBreakdown(taxableNonPropertyGains, taxableIncome, taxBands, false);
    const capitalGainsTax = roundToTwoDecimals(capitalGainsTaxBreakdown.total);

    // Property gains use different rates: 18% (basic) and 28% (higher/additional)
    const propertyGainsTaxBreakdown = calculateCapitalGainsTaxWithBreakdown(taxablePropertyGains, taxableIncome, taxBands, true);
    const propertyGainsTax = roundToTwoDecimals(propertyGainsTaxBreakdown.total);

    const totalTaxLiability = roundToTwoDecimals(incomeTax + dividendTax + capitalGainsTax + propertyGainsTax);

    // Tax already paid
    const payeTaxPaid = roundToTwoDecimals(wizardData?.employmentIncome?.payeTaxPaid || 0);
    const niPaid = roundToTwoDecimals(wizardData?.employmentIncome?.niPaid || 0);

    const taxOwedOrRefund = roundToTwoDecimals(totalTaxLiability - payeTaxPaid);

    return {
        employmentIncome,
        rentalIncome,
        savingsInterest,
        dividendsFromPortfolio,
        otherDividends,
        totalDividends,
        totalIncome,
        gainsFromPortfolio,
        propertyGains,
        cryptoGains,
        otherCapitalGains,
        totalNonPropertyGains,
        totalCapitalGains,
        personalAllowance,
        marriageAllowance,
        blindPersonAllowance,
        charitableDonations,
        carriedForwardLosses,
        cgtAnnualExemption: cgtAllowance,
        dividendAllowance,
        savingsAllowance: actualSavingsAllowance,
        taxableEmploymentIncome,
        taxableRentalIncome,
        taxableSavingsInterest,
        taxableDividends,
        taxableNonPropertyGains,
        taxablePropertyGains,
        incomeTax,
        incomeTaxBreakdown,
        dividendTax,
        dividendTaxBreakdown,
        capitalGainsTax,
        capitalGainsTaxBreakdown,
        propertyGainsTax,
        propertyGainsTaxBreakdown,
        totalTaxLiability,
        payeTaxPaid,
        niPaid,
        taxOwedOrRefund
    };
}

function getTaxBands(taxYear: string, residency: string): TaxBands {
    if (residency === 'england-wales-ni') {
        return {
            personalAllowance: 12570,
            basicRateLimit: 50270,
            higherRateLimit: 125140,
            basicRate: 0.20,
            higherRate: 0.40,
            additionalRate: 0.45
        };
    }

    return {
        personalAllowance: 12570,
        basicRateLimit: 43662,
        higherRateLimit: 125140,
        basicRate: 0.20,
        higherRate: 0.42,
        additionalRate: 0.47
    };
}

function getAllowances(taxYear: string) {
    if (taxYear === '2023-2024') {
        return { cgtAllowance: 6000, dividendAllowance: 1000, savingsAllowance: 1000 };
    } else if (taxYear === '2024-2025') {
        return { cgtAllowance: 3000, dividendAllowance: 500, savingsAllowance: 1000 };
    } else if (taxYear === '2022-2023') {
        return { cgtAllowance: 12300, dividendAllowance: 2000, savingsAllowance: 1000 };
    }
    return { cgtAllowance: 3000, dividendAllowance: 500, savingsAllowance: 1000 };
}

function calculateIncomeTaxWithBreakdown(taxableIncome: number, bands: TaxBands): TaxBreakdown {
    if (taxableIncome <= 0) {
        return { basicRateAmount: 0, basicRateTax: 0, higherRateAmount: 0, higherRateTax: 0, additionalRateAmount: 0, additionalRateTax: 0, total: 0 };
    }

    const basicRateAmount = Math.min(taxableIncome, bands.basicRateLimit - bands.personalAllowance);
    const basicRateTax = roundToTwoDecimals(basicRateAmount * bands.basicRate);

    let higherRateAmount = 0;
    let higherRateTax = 0;
    if (taxableIncome > bands.basicRateLimit - bands.personalAllowance) {
        higherRateAmount = Math.min(
            taxableIncome - (bands.basicRateLimit - bands.personalAllowance),
            bands.higherRateLimit - bands.basicRateLimit
        );
        higherRateTax = roundToTwoDecimals(higherRateAmount * bands.higherRate);
    }

    let additionalRateAmount = 0;
    let additionalRateTax = 0;
    if (taxableIncome > bands.higherRateLimit - bands.personalAllowance) {
        additionalRateAmount = taxableIncome - (bands.higherRateLimit - bands.personalAllowance);
        additionalRateTax = roundToTwoDecimals(additionalRateAmount * bands.additionalRate);
    }

    return {
        basicRateAmount: roundToTwoDecimals(basicRateAmount),
        basicRateTax,
        higherRateAmount: roundToTwoDecimals(higherRateAmount),
        higherRateTax,
        additionalRateAmount: roundToTwoDecimals(additionalRateAmount),
        additionalRateTax,
        total: roundToTwoDecimals(basicRateTax + higherRateTax + additionalRateTax)
    };
}

function calculateDividendTaxWithBreakdown(taxableDividends: number, otherTaxableIncome: number, bands: TaxBands): TaxBreakdown {
    if (taxableDividends <= 0) {
        return { basicRateAmount: 0, basicRateTax: 0, higherRateAmount: 0, higherRateTax: 0, additionalRateAmount: 0, additionalRateTax: 0, total: 0 };
    }

    let remainingDividends = taxableDividends;
    const basicRateRemaining = Math.max(0, (bands.basicRateLimit - bands.personalAllowance) - otherTaxableIncome);

    const basicRateAmount = Math.min(remainingDividends, basicRateRemaining);
    const basicRateTax = roundToTwoDecimals(basicRateAmount * 0.0875);
    remainingDividends -= basicRateAmount;

    const higherRateRemaining = Math.max(0, bands.higherRateLimit - bands.basicRateLimit);
    const higherRateAmount = Math.min(remainingDividends, higherRateRemaining);
    const higherRateTax = roundToTwoDecimals(higherRateAmount * 0.3375);
    remainingDividends -= higherRateAmount;

    const additionalRateAmount = remainingDividends;
    const additionalRateTax = roundToTwoDecimals(additionalRateAmount * 0.3935);

    return {
        basicRateAmount: roundToTwoDecimals(basicRateAmount),
        basicRateTax,
        higherRateAmount: roundToTwoDecimals(higherRateAmount),
        higherRateTax,
        additionalRateAmount: roundToTwoDecimals(additionalRateAmount),
        additionalRateTax,
        total: roundToTwoDecimals(basicRateTax + higherRateTax + additionalRateTax)
    };
}

function calculateCapitalGainsTaxWithBreakdown(
    taxableGains: number,
    otherTaxableIncome: number,
    bands: TaxBands,
    isProperty: boolean
): TaxBreakdown {
    if (taxableGains <= 0) {
        return { basicRateAmount: 0, basicRateTax: 0, higherRateAmount: 0, higherRateTax: 0, additionalRateAmount: 0, additionalRateTax: 0, total: 0 };
    }

    // Property has different rates: 18% (basic) and 28% (higher/additional)
    // Non-property: 10% (basic) and 20% (higher/additional)
    const basicRate = isProperty ? 0.18 : 0.10;
    const higherRate = isProperty ? 0.28 : 0.20;

    let remainingGains = taxableGains;
    const basicRateRemaining = Math.max(0, (bands.basicRateLimit - bands.personalAllowance) - otherTaxableIncome);

    const basicRateAmount = Math.min(remainingGains, basicRateRemaining);
    const basicRateTax = roundToTwoDecimals(basicRateAmount * basicRate);
    remainingGains -= basicRateAmount;

    // For CGT, higher and additional rates are the same
    const higherRateAmount = remainingGains;
    const higherRateTax = roundToTwoDecimals(higherRateAmount * higherRate);

    return {
        basicRateAmount: roundToTwoDecimals(basicRateAmount),
        basicRateTax,
        higherRateAmount: roundToTwoDecimals(higherRateAmount),
        higherRateTax,
        additionalRateAmount: 0,
        additionalRateTax: 0,
        total: roundToTwoDecimals(basicRateTax + higherRateTax)
    };
}
