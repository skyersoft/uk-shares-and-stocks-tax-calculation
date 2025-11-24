import React from 'react';
import { WizardData } from '../../types/calculator';

interface CalculationParametersProps {
    data: WizardData;
    className?: string;
}

export const CalculationParameters: React.FC<CalculationParametersProps> = ({ data, className = '' }) => {
    if (!data) return null;

    const { incomeSources, taxYear, analysisType, personalDetails, employmentIncome, rentalIncome } = data;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: 'GBP'
        }).format(amount);
    };

    const getResidencyLabel = (residency: string) => {
        switch (residency) {
            case 'england-wales-ni': return 'England, Wales & Northern Ireland';
            case 'scotland': return 'Scotland';
            default: return residency;
        }
    };

    return (
        <div className={`card shadow-sm border-0 ${className}`}>
            <div className="card-header bg-white border-bottom-0 pt-4 px-4">
                <h5 className="mb-0 text-primary">
                    <i className="fas fa-sliders-h me-2"></i>
                    Calculation Parameters
                </h5>
            </div>
            <div className="card-body p-4">
                <div className="row g-4">
                    {/* Basic Settings */}
                    <div className="col-md-6 col-lg-3">
                        <h6 className="text-muted mb-3 text-uppercase small fw-bold">Configuration</h6>
                        <ul className="list-unstyled mb-0">
                            <li className="mb-2">
                                <span className="text-muted d-block small">Tax Year</span>
                                <span className="fw-medium">{taxYear}</span>
                            </li>
                            <li className="mb-2">
                                <span className="text-muted d-block small">Analysis Type</span>
                                <span className="fw-medium text-capitalize">{analysisType}</span>
                            </li>
                            <li>
                                <span className="text-muted d-block small">Tax Residency</span>
                                <span className="fw-medium">{getResidencyLabel(personalDetails.taxResidency)}</span>
                            </li>
                        </ul>
                    </div>

                    {/* Income Sources */}
                    <div className="col-md-6 col-lg-3">
                        <h6 className="text-muted mb-3 text-uppercase small fw-bold">Income Sources</h6>
                        <div className="d-flex flex-wrap gap-2">
                            {incomeSources.investmentPortfolio && (
                                <span className="badge bg-light text-dark border">Investment Portfolio</span>
                            )}
                            {incomeSources.employmentIncome && (
                                <span className="badge bg-light text-dark border">Employment</span>
                            )}
                            {incomeSources.selfEmploymentIncome && (
                                <span className="badge bg-light text-dark border">Self Employment</span>
                            )}
                            {incomeSources.rentalIncome && (
                                <span className="badge bg-light text-dark border">Rental</span>
                            )}
                            {incomeSources.otherDividends && (
                                <span className="badge bg-light text-dark border">Other Dividends</span>
                            )}
                            {incomeSources.otherCapitalGains && (
                                <span className="badge bg-light text-dark border">Other Capital Gains</span>
                            )}
                        </div>
                    </div>

                    {/* Financial Details */}
                    {(incomeSources.employmentIncome || incomeSources.rentalIncome) && (
                        <div className="col-md-6 col-lg-3">
                            <h6 className="text-muted mb-3 text-uppercase small fw-bold">Financial Details</h6>
                            <ul className="list-unstyled mb-0">
                                {incomeSources.employmentIncome && employmentIncome && (
                                    <li className="mb-2">
                                        <span className="text-muted d-block small">Gross Salary</span>
                                        <span className="fw-medium">{formatCurrency(employmentIncome.grossSalary)}</span>
                                    </li>
                                )}
                                {incomeSources.rentalIncome && rentalIncome && (
                                    <li>
                                        <span className="text-muted d-block small">Gross Rental Income</span>
                                        <span className="fw-medium">{formatCurrency(rentalIncome.grossRentalIncome)}</span>
                                    </li>
                                )}
                            </ul>
                        </div>
                    )}

                    {/* Personal Allowances */}
                    <div className="col-md-6 col-lg-3">
                        <h6 className="text-muted mb-3 text-uppercase small fw-bold">Allowances & Reliefs</h6>
                        <ul className="list-unstyled mb-0">
                            <li className="mb-2">
                                <i className={`fas fa-${personalDetails.claimMarriageAllowance ? 'check text-success' : 'times text-muted'} me-2`}></i>
                                <span className="small">Marriage Allowance</span>
                            </li>
                            <li className="mb-2">
                                <i className={`fas fa-${personalDetails.claimBlindPersonAllowance ? 'check text-success' : 'times text-muted'} me-2`}></i>
                                <span className="small">Blind Person's Allowance</span>
                            </li>
                            {personalDetails.carriedForwardLosses > 0 && (
                                <li>
                                    <span className="text-muted d-block small">Carried Forward Losses</span>
                                    <span className="fw-medium">{formatCurrency(personalDetails.carriedForwardLosses)}</span>
                                </li>
                            )}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};
