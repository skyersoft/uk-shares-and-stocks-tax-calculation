import React, { useMemo } from 'react';
import { Card } from '../ui/Card';
import { NormalizedResults } from '../../types/calculation';
import { WizardData } from '../../types/calculator';
import { calculateComprehensiveTax } from '../../utils/comprehensiveTaxCalculation';

interface DetailedTaxBreakdownProps {
    normalizedResults: NormalizedResults;
    wizardData: WizardData | null;
    taxCalculations: any;
    className?: string;
}

export const DetailedTaxBreakdown: React.FC<DetailedTaxBreakdownProps> = ({
    normalizedResults,
    wizardData,
    taxCalculations,
    className = ''
}) => {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: 'GBP',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    };

    // Calculate comprehensive tax including all wizard inputs
    // MEMOIZED to prevent expensive recalculation on every render
    const taxYear = wizardData?.taxYear || normalizedResults.taxYear || '2024-2025';
    const comprehensiveTax = useMemo(
        () => calculateComprehensiveTax(normalizedResults, wizardData, taxYear),
        [normalizedResults, wizardData, taxYear]
    );

    return (
        <div className={`detailed-tax-breakdown ${className}`}>
            <Card className="shadow-sm border-0">
                <div className="card-header bg-white border-bottom pt-4 px-4 pb-3">
                    <h5 className="mb-2 text-primary">
                        <i className="fas fa-file-invoice-dollar me-2"></i>
                        Complete Tax Calculation Breakdown
                    </h5>
                    <p className="text-muted small mb-0">
                        Step-by-step calculation with references to UK Self Assessment form boxes
                    </p>
                </div>

                <div className="card-body p-4">
                    {/* SECTION 1: INCOME SUMMARY */}
                    <div className="mb-5">
                        <h6 className="text-uppercase fw-bold text-primary mb-3 pb-2 border-bottom">
                            <i className="fas fa-pound-sign me-2"></i>
                            Step 1: Total Income Calculation
                        </h6>

                        <div className="table-responsive">
                            <table className="table table-sm table-borderless">
                                <tbody>
                                    {comprehensiveTax.employmentIncome > 0 && (
                                        <tr>
                                            <td className="ps-3">
                                                <i className="fas fa-briefcase me-2 text-muted"></i>
                                                Employment Income (Salary + Bonuses + Benefits)
                                                <div className="small text-muted">SA102 - Box 1</div>
                                            </td>
                                            <td className="text-end fw-medium" style={{ width: '150px' }}>
                                                {formatCurrency(comprehensiveTax.employmentIncome)}
                                            </td>
                                        </tr>
                                    )}

                                    {comprehensiveTax.rentalIncome > 0 && (
                                        <tr>
                                            <td className="ps-3">
                                                <i className="fas fa-home me-2 text-muted"></i>
                                                Rental Income (Net)
                                                <div className="small text-muted">SA105 - Property Income</div>
                                            </td>
                                            <td className="text-end fw-medium">
                                                {formatCurrency(comprehensiveTax.rentalIncome)}
                                            </td>
                                        </tr>
                                    )}

                                    {comprehensiveTax.savingsInterest > 0 && (
                                        <tr>
                                            <td className="ps-3">
                                                <i className="fas fa-piggy-bank me-2 text-muted"></i>
                                                Savings Interest
                                                <div className="small text-muted">SA100 - Interest</div>
                                            </td>
                                            <td className="text-end fw-medium">
                                                {formatCurrency(comprehensiveTax.savingsInterest)}
                                            </td>
                                        </tr>
                                    )}

                                    <tr className="border-top">
                                        <td className="ps-3 fw-bold text-primary">
                                            <i className="fas fa-equals me-2"></i>
                                            Total Income
                                        </td>
                                        <td className="text-end fw-bold text-primary h6 mb-0">
                                            {formatCurrency(comprehensiveTax.totalIncome)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* SECTION 2: INCOME TAX CALCULATION */}
                    {comprehensiveTax.totalIncome > 0 && (
                        <div className="mb-5">
                            <h6 className="text-uppercase fw-bold text-primary mb-3 pb-2 border-bottom">
                                <i className="fas fa-calculator me-2"></i>
                                Step 2: Income Tax Calculation
                            </h6>

                            <div className="table-responsive">
                                <table className="table table-sm">
                                    <tbody>
                                        <tr>
                                            <td className="ps-3">Total Income</td>
                                            <td className="text-end">{formatCurrency(comprehensiveTax.totalIncome)}</td>
                                        </tr>
                                        <tr>
                                            <td className="ps-4 text-muted">
                                                <em>Less: Personal Allowance</em>
                                                {comprehensiveTax.totalIncome > 100000 && (
                                                    <div className="small">(Reduced due to income &gt; £100,000)</div>
                                                )}
                                            </td>
                                            <td className="text-end text-danger">
                                                ({formatCurrency(comprehensiveTax.personalAllowance)})
                                            </td>
                                        </tr>
                                        {comprehensiveTax.blindPersonAllowance > 0 && (
                                            <tr>
                                                <td className="ps-4 text-muted">
                                                    <em>Less: Blind Person's Allowance</em>
                                                </td>
                                                <td className="text-end text-danger">
                                                    ({formatCurrency(comprehensiveTax.blindPersonAllowance)})
                                                </td>
                                            </tr>
                                        )}
                                        <tr className="border-top">
                                            <td className="ps-3 fw-semibold">Taxable Income</td>
                                            <td className="text-end fw-semibold">
                                                {formatCurrency(comprehensiveTax.taxableEmploymentIncome + comprehensiveTax.taxableRentalIncome + comprehensiveTax.taxableSavingsInterest)}
                                            </td>
                                        </tr>

                                        {/* Tax Band Breakdown */}
                                        <tr className="bg-light">
                                            <td colSpan={2} className="pt-3 pb-2">
                                                <strong>Tax by Band:</strong>
                                            </td>
                                        </tr>
                                        {comprehensiveTax.incomeTaxBreakdown.basicRateAmount > 0 && (
                                            <tr>
                                                <td className="ps-4">
                                                    Basic Rate (20%) on {formatCurrency(comprehensiveTax.incomeTaxBreakdown.basicRateAmount)}
                                                </td>
                                                <td className="text-end">{formatCurrency(comprehensiveTax.incomeTaxBreakdown.basicRateTax)}</td>
                                            </tr>
                                        )}
                                        {comprehensiveTax.incomeTaxBreakdown.higherRateAmount > 0 && (
                                            <tr>
                                                <td className="ps-4">
                                                    Higher Rate (40%) on {formatCurrency(comprehensiveTax.incomeTaxBreakdown.higherRateAmount)}
                                                </td>
                                                <td className="text-end">{formatCurrency(comprehensiveTax.incomeTaxBreakdown.higherRateTax)}</td>
                                            </tr>
                                        )}
                                        {comprehensiveTax.incomeTaxBreakdown.additionalRateAmount > 0 && (
                                            <tr>
                                                <td className="ps-4">
                                                    Additional Rate (45%) on {formatCurrency(comprehensiveTax.incomeTaxBreakdown.additionalRateAmount)}
                                                </td>
                                                <td className="text-end">{formatCurrency(comprehensiveTax.incomeTaxBreakdown.additionalRateTax)}</td>
                                            </tr>
                                        )}

                                        <tr className="border-top bg-success bg-opacity-10">
                                            <td className="ps-3 fw-bold text-success">
                                                <i className="fas fa-check-circle me-2"></i>
                                                Income Tax Due
                                            </td>
                                            <td className="text-end fw-bold text-success h6 mb-0">
                                                {formatCurrency(comprehensiveTax.incomeTax)}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* SECTION 3: DIVIDEND TAX */}
                    {comprehensiveTax.totalDividends > 0 && (
                        <div className="mb-5">
                            <h6 className="text-uppercase fw-bold text-primary mb-3 pb-2 border-bottom">
                                <i className="fas fa-coins me-2"></i>
                                Step 3: Dividend Tax Calculation
                            </h6>

                            <div className="alert alert-info small mb-3">
                                <i className="fas fa-info-circle me-2"></i>
                                <strong>SA100 - Dividends:</strong> Report total dividends received
                            </div>

                            <div className="table-responsive">
                                <table className="table table-sm">
                                    <tbody>
                                        {comprehensiveTax.dividendsFromPortfolio > 0 && (
                                            <tr>
                                                <td className="ps-3">Dividends from Portfolio</td>
                                                <td className="text-end">{formatCurrency(comprehensiveTax.dividendsFromPortfolio)}</td>
                                            </tr>
                                        )}
                                        {comprehensiveTax.otherDividends > 0 && (
                                            <tr>
                                                <td className="ps-3">Other Dividends</td>
                                                <td className="text-end">{formatCurrency(comprehensiveTax.otherDividends)}</td>
                                            </tr>
                                        )}
                                        <tr className="border-top">
                                            <td className="ps-3 fw-semibold">Total Dividends</td>
                                            <td className="text-end fw-semibold">{formatCurrency(comprehensiveTax.totalDividends)}</td>
                                        </tr>
                                        <tr>
                                            <td className="ps-4 text-muted">
                                                <em>Less: Dividend Allowance ({taxYear})</em>
                                            </td>
                                            <td className="text-end text-danger">
                                                ({formatCurrency(comprehensiveTax.dividendAllowance)})
                                            </td>
                                        </tr>
                                        <tr className="border-top">
                                            <td className="ps-3 fw-semibold">Taxable Dividends</td>
                                            <td className="text-end fw-semibold">{formatCurrency(comprehensiveTax.taxableDividends)}</td>
                                        </tr>

                                        {/* Dividend Tax Band Breakdown */}
                                        <tr className="bg-light">
                                            <td colSpan={2} className="pt-3 pb-2">
                                                <strong>Tax by Band:</strong>
                                            </td>
                                        </tr>
                                        {comprehensiveTax.dividendTaxBreakdown.basicRateAmount > 0 && (
                                            <tr>
                                                <td className="ps-4">
                                                    Basic Rate (8.75%) on {formatCurrency(comprehensiveTax.dividendTaxBreakdown.basicRateAmount)}
                                                </td>
                                                <td className="text-end">{formatCurrency(comprehensiveTax.dividendTaxBreakdown.basicRateTax)}</td>
                                            </tr>
                                        )}
                                        {comprehensiveTax.dividendTaxBreakdown.higherRateAmount > 0 && (
                                            <tr>
                                                <td className="ps-4">
                                                    Higher Rate (33.75%) on {formatCurrency(comprehensiveTax.dividendTaxBreakdown.higherRateAmount)}
                                                </td>
                                                <td className="text-end">{formatCurrency(comprehensiveTax.dividendTaxBreakdown.higherRateTax)}</td>
                                            </tr>
                                        )}
                                        {comprehensiveTax.dividendTaxBreakdown.additionalRateAmount > 0 && (
                                            <tr>
                                                <td className="ps-4">
                                                    Additional Rate (39.35%) on {formatCurrency(comprehensiveTax.dividendTaxBreakdown.additionalRateAmount)}
                                                </td>
                                                <td className="text-end">{formatCurrency(comprehensiveTax.dividendTaxBreakdown.additionalRateTax)}</td>
                                            </tr>
                                        )}

                                        <tr className="border-top bg-success bg-opacity-10">
                                            <td className="ps-3 fw-bold text-success">
                                                <i className="fas fa-check-circle me-2"></i>
                                                Dividend Tax Due
                                            </td>
                                            <td className="text-end fw-bold text-success h6 mb-0">
                                                {formatCurrency(comprehensiveTax.dividendTax)}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* SECTION 4: CAPITAL GAINS TAX */}
                    {comprehensiveTax.totalCapitalGains !== 0 && (
                        <div className="mb-5">
                            <h6 className="text-uppercase fw-bold text-primary mb-3 pb-2 border-bottom">
                                <i className="fas fa-chart-line me-2"></i>
                                Step 4: Capital Gains Tax Calculation
                            </h6>

                            <div className="alert alert-info small mb-3">
                                <i className="fas fa-info-circle me-2"></i>
                                <strong>SA108 - Capital Gains Summary:</strong> Report all asset disposals
                            </div>

                            <div className="table-responsive">
                                <table className="table table-sm">
                                    <tbody>
                                        {/* Portfolio Gains */}
                                        {comprehensiveTax.gainsFromPortfolio !== 0 && (
                                            <tr>
                                                <td className="ps-3">
                                                    <i className="fas fa-briefcase me-2 text-muted"></i>
                                                    Gains from Portfolio (Shares)
                                                    <div className="small text-muted">SA108 - Box 17 (Listed shares)</div>
                                                </td>
                                                <td className="text-end fw-medium">
                                                    {formatCurrency(comprehensiveTax.gainsFromPortfolio)}
                                                </td>
                                            </tr>
                                        )}

                                        {/* Property Gains */}
                                        {comprehensiveTax.propertyGains > 0 && (
                                            <tr>
                                                <td className="ps-3">
                                                    <i className="fas fa-home me-2 text-muted"></i>
                                                    Property Gains
                                                    <div className="small text-muted">SA108 - Box 17 (Property)</div>
                                                </td>
                                                <td className="text-end fw-medium">
                                                    {formatCurrency(comprehensiveTax.propertyGains)}
                                                </td>
                                            </tr>
                                        )}

                                        {/* Crypto Gains */}
                                        {comprehensiveTax.cryptoGains !== 0 && (
                                            <tr>
                                                <td className="ps-3">
                                                    <i className="fab fa-bitcoin me-2 text-muted"></i>
                                                    Cryptocurrency Gains
                                                    <div className="small text-muted">SA108 - Box 13 (Crypto assets)</div>
                                                </td>
                                                <td className="text-end fw-medium">
                                                    {formatCurrency(comprehensiveTax.cryptoGains)}
                                                </td>
                                            </tr>
                                        )}

                                        {/* Other Gains */}
                                        {comprehensiveTax.otherCapitalGains !== 0 && (
                                            <tr>
                                                <td className="ps-3">
                                                    <i className="fas fa-ellipsis-h me-2 text-muted"></i>
                                                    Other Capital Gains
                                                    <div className="small text-muted">SA108 - Box 14-17 (Other assets)</div>
                                                </td>
                                                <td className="text-end fw-medium">
                                                    {formatCurrency(comprehensiveTax.otherCapitalGains)}
                                                </td>
                                            </tr>
                                        )}

                                        <tr className="border-top">
                                            <td className="ps-3 fw-semibold">Total Capital Gains</td>
                                            <td className="text-end fw-semibold">
                                                {formatCurrency(comprehensiveTax.totalCapitalGains)}
                                            </td>
                                        </tr>

                                        <tr>
                                            <td className="ps-4 text-muted">
                                                <em>Less: Annual Exempt Amount ({taxYear})</em>
                                                <div className="small">SA108 - Box 3</div>
                                            </td>
                                            <td className="text-end text-danger">
                                                ({formatCurrency(comprehensiveTax.cgtAnnualExemption)})
                                            </td>
                                        </tr>

                                        {comprehensiveTax.carriedForwardLosses > 0 && (
                                            <tr>
                                                <td className="ps-4 text-muted">
                                                    <em>Less: Losses Brought Forward</em>
                                                    <div className="small">SA108 - Box 6</div>
                                                </td>
                                                <td className="text-end text-danger">
                                                    ({formatCurrency(comprehensiveTax.carriedForwardLosses)})
                                                </td>
                                            </tr>
                                        )}

                                        <tr className="border-top">
                                            <td className="ps-3 fw-semibold">Taxable Capital Gains</td>
                                            <td className="text-end fw-semibold">
                                                {formatCurrency(comprehensiveTax.taxableNonPropertyGains + comprehensiveTax.taxablePropertyGains)}
                                            </td>
                                        </tr>

                                        {/* CGT Band Breakdown */}
                                        <tr className="bg-light">
                                            <td colSpan={2} className="pt-3 pb-2">
                                                <strong>Tax by Band:</strong>
                                            </td>
                                        </tr>

                                        {/* Non-Property CGT */}
                                        {comprehensiveTax.taxableNonPropertyGains > 0 && (
                                            <>
                                                {comprehensiveTax.capitalGainsTaxBreakdown.basicRateAmount > 0 && (
                                                    <tr>
                                                        <td className="ps-4">
                                                            Basic Rate (10%) on {formatCurrency(comprehensiveTax.capitalGainsTaxBreakdown.basicRateAmount)}
                                                            <div className="small text-muted">Shares/Crypto at basic rate</div>
                                                        </td>
                                                        <td className="text-end">{formatCurrency(comprehensiveTax.capitalGainsTaxBreakdown.basicRateTax)}</td>
                                                    </tr>
                                                )}
                                                {comprehensiveTax.capitalGainsTaxBreakdown.higherRateAmount > 0 && (
                                                    <tr>
                                                        <td className="ps-4">
                                                            Higher Rate (20%) on {formatCurrency(comprehensiveTax.capitalGainsTaxBreakdown.higherRateAmount)}
                                                            <div className="small text-muted">Shares/Crypto at higher/additional rate</div>
                                                        </td>
                                                        <td className="text-end">{formatCurrency(comprehensiveTax.capitalGainsTaxBreakdown.higherRateTax)}</td>
                                                    </tr>
                                                )}
                                            </>
                                        )}

                                        {/* Property CGT (different rates) */}
                                        {comprehensiveTax.taxablePropertyGains > 0 && (
                                            <>
                                                {comprehensiveTax.propertyGainsTaxBreakdown.basicRateAmount > 0 && (
                                                    <tr>
                                                        <td className="ps-4">
                                                            Basic Rate (18%) on {formatCurrency(comprehensiveTax.propertyGainsTaxBreakdown.basicRateAmount)}
                                                            <div className="small text-muted">Property at basic rate</div>
                                                        </td>
                                                        <td className="text-end">{formatCurrency(comprehensiveTax.propertyGainsTaxBreakdown.basicRateTax)}</td>
                                                    </tr>
                                                )}
                                                {comprehensiveTax.propertyGainsTaxBreakdown.higherRateAmount > 0 && (
                                                    <tr>
                                                        <td className="ps-4">
                                                            Higher Rate (28%) on {formatCurrency(comprehensiveTax.propertyGainsTaxBreakdown.higherRateAmount)}
                                                            <div className="small text-muted">Property at higher/additional rate</div>
                                                        </td>
                                                        <td className="text-end">{formatCurrency(comprehensiveTax.propertyGainsTaxBreakdown.higherRateTax)}</td>
                                                    </tr>
                                                )}
                                            </>
                                        )}

                                        <tr className="border-top bg-success bg-opacity-10">
                                            <td className="ps-3 fw-bold text-success">
                                                <i className="fas fa-check-circle me-2"></i>
                                                Capital Gains Tax Due
                                                <div className="small text-muted fw-normal">SA108 - Total CGT</div>
                                            </td>
                                            <td className="text-end fw-bold text-success h6 mb-0">
                                                {formatCurrency(comprehensiveTax.capitalGainsTax + comprehensiveTax.propertyGainsTax)}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* SECTION 5: TOTAL TAX SUMMARY */}
                    <div className="mb-4">
                        <h6 className="text-uppercase fw-bold text-primary mb-3 pb-2 border-bottom">
                            <i className="fas fa-file-alt me-2"></i>
                            Step 5: Total Tax Liability Summary
                        </h6>

                        <div className="card bg-primary bg-opacity-10 border-primary">
                            <div className="card-body">
                                <div className="table-responsive">
                                    <table className="table table-sm mb-0">
                                        <tbody>
                                            {comprehensiveTax.incomeTax > 0 && (
                                                <tr>
                                                    <td>Income Tax</td>
                                                    <td className="text-end fw-medium">{formatCurrency(comprehensiveTax.incomeTax)}</td>
                                                </tr>
                                            )}
                                            {comprehensiveTax.dividendTax > 0 && (
                                                <tr>
                                                    <td>Dividend Tax</td>
                                                    <td className="text-end fw-medium">{formatCurrency(comprehensiveTax.dividendTax)}</td>
                                                </tr>
                                            )}
                                            {(comprehensiveTax.capitalGainsTax + comprehensiveTax.propertyGainsTax) > 0 && (
                                                <tr>
                                                    <td>Capital Gains Tax</td>
                                                    <td className="text-end fw-medium">
                                                        {formatCurrency(comprehensiveTax.capitalGainsTax + comprehensiveTax.propertyGainsTax)}
                                                    </td>
                                                </tr>
                                            )}
                                            <tr className="border-top">
                                                <td className="fw-bold text-primary h6 mb-0">
                                                    <i className="fas fa-calculator me-2"></i>
                                                    TOTAL TAX LIABILITY
                                                </td>
                                                <td className="text-end fw-bold text-primary h5 mb-0">
                                                    {formatCurrency(comprehensiveTax.totalTaxLiability)}
                                                </td>
                                            </tr>

                                            {comprehensiveTax.payeTaxPaid > 0 && (
                                                <>
                                                    <tr className="border-top">
                                                        <td className="text-muted">
                                                            Less: Tax Already Paid (PAYE)
                                                            <div className="small">From P60/P45</div>
                                                        </td>
                                                        <td className="text-end text-success">
                                                            ({formatCurrency(comprehensiveTax.payeTaxPaid)})
                                                        </td>
                                                    </tr>
                                                    <tr className="border-top bg-white">
                                                        <td className={`fw-bold ${comprehensiveTax.taxOwedOrRefund >= 0 ? 'text-danger' : 'text-success'}`}>
                                                            <i className={`fas ${comprehensiveTax.taxOwedOrRefund >= 0 ? 'fa-exclamation-triangle' : 'fa-check-circle'} me-2`}></i>
                                                            {comprehensiveTax.taxOwedOrRefund >= 0 ? 'Amount to Pay' : 'Tax Refund Due'}
                                                        </td>
                                                        <td className={`text-end fw-bold h5 mb-0 ${comprehensiveTax.taxOwedOrRefund >= 0 ? 'text-danger' : 'text-success'}`}>
                                                            {formatCurrency(Math.abs(comprehensiveTax.taxOwedOrRefund))}
                                                        </td>
                                                    </tr>
                                                </>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* HELP SECTION */}
                    <div className="alert alert-warning mb-0">
                        <h6 className="alert-heading">
                            <i className="fas fa-lightbulb me-2"></i>
                            How to Use This Information
                        </h6>
                        <ul className="small mb-0">
                            <li><strong>SA100:</strong> Main tax return form - report employment income and dividends</li>
                            <li><strong>SA102:</strong> Employment page - report salary, bonuses, and tax already paid</li>
                            <li><strong>SA108:</strong> Capital Gains Summary - report all asset disposals with box numbers shown above</li>
                            <li><strong>Keep Records:</strong> Save this calculation and all supporting documents for 6 years</li>
                            <li><strong>Deadline:</strong> Online filing deadline is 31 January following the tax year end</li>
                            <li><strong>Professional Advice:</strong> Consider consulting a tax advisor for complex situations</li>
                        </ul>
                    </div>
                </div>
            </Card>
        </div>
    );
};
