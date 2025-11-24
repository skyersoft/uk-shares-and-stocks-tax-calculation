import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { ResultsDisposalsTable } from './ResultsDisposalsTable';
import { ResultsHoldingsTable } from './HoldingsTable';
import { ResultsDividendsTable } from './ResultsDividendsTable';
import { NormalizedResults, PortfolioAnalysis, TaxCalculation } from '../../types/calculation';

interface ResultsTabsProps {
    normalizedResults: NormalizedResults;
    portfolioAnalysis: PortfolioAnalysis;
    taxCalculations: TaxCalculation;
    className?: string;
}

export const ResultsTabs: React.FC<ResultsTabsProps> = ({
    normalizedResults,
    portfolioAnalysis,
    taxCalculations,
    className = ''
}) => {
    const [activeTab, setActiveTab] = useState<'disposals' | 'holdings' | 'dividends' | 'pools'>('disposals');

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: 'GBP'
        }).format(amount);
    };

    const tabs = [
        {
            id: 'disposals' as const,
            label: 'Disposals',
            icon: 'fas fa-exchange-alt',
            count: normalizedResults.counts.disposals
        },
        {
            id: 'holdings' as const,
            label: 'Holdings',
            icon: 'fas fa-briefcase',
            count: normalizedResults.counts.holdings
        },
        {
            id: 'dividends' as const,
            label: 'Dividends',
            icon: 'fas fa-coins',
            count: normalizedResults.counts.dividends
        },
        {
            id: 'pools' as const,
            label: 'Section 104 Pools',
            icon: 'fas fa-layer-group',
            count: Object.keys(taxCalculations.section_104_pools || {}).length
        }
    ];

    return (
        <div className={`results-tabs ${className}`}>
            <Card className="shadow-sm border-0">
                <div className="card-header bg-white border-bottom px-4 pt-4 pb-0">
                    <h5 className="mb-3 text-primary">
                        <i className="fas fa-table me-2"></i>
                        Detailed Transaction Data
                    </h5>
                    <ul className="nav nav-tabs card-header-tabs" role="tablist">
                        {tabs.map(tab => (
                            <li className="nav-item" key={tab.id} role="presentation">
                                <button
                                    className={`nav-link ${activeTab === tab.id ? 'active' : ''}`}
                                    onClick={() => setActiveTab(tab.id)}
                                    type="button"
                                    role="tab"
                                    aria-selected={activeTab === tab.id}
                                >
                                    <i className={`${tab.icon} me-2`}></i>
                                    {tab.label}
                                    {tab.count > 0 && (
                                        <span className="badge bg-primary ms-2">{tab.count}</span>
                                    )}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="card-body p-4">
                    <div className="tab-content">
                        {/* Disposals Tab */}
                        {activeTab === 'disposals' && (
                            <div className="tab-pane fade show active">
                                <ResultsDisposalsTable
                                    disposals={normalizedResults.disposals}
                                    className="border-0 shadow-none"
                                />
                            </div>
                        )}

                        {/* Holdings Tab */}
                        {activeTab === 'holdings' && (
                            <div className="tab-pane fade show active">
                                <ResultsHoldingsTable
                                    holdings={normalizedResults.holdings}
                                    marketSummaries={portfolioAnalysis.market_summaries}
                                    className="border-0 shadow-none"
                                />
                            </div>
                        )}

                        {/* Dividends Tab */}
                        {activeTab === 'dividends' && (
                            <div className="tab-pane fade show active">
                                <ResultsDividendsTable
                                    dividends={normalizedResults.dividends}
                                    className="border-0 shadow-none"
                                />
                            </div>
                        )}

                        {/* Section 104 Pools Tab */}
                        {activeTab === 'pools' && (
                            <div className="tab-pane fade show active">
                                <div className="alert alert-info mb-4">
                                    <div className="d-flex align-items-start">
                                        <i className="fas fa-info-circle me-3 mt-1"></i>
                                        <div>
                                            <strong>Section 104 Pools</strong> track the average cost of identical shares.
                                            These pools are used to calculate capital gains when shares are disposed of according to HMRC rules.
                                        </div>
                                    </div>
                                </div>

                                {Object.keys(taxCalculations.section_104_pools || {}).length === 0 ? (
                                    <div className="text-center text-muted py-5">
                                        <i className="fas fa-layer-group fa-3x mb-3 opacity-25"></i>
                                        <p>No Section 104 pools to display</p>
                                    </div>
                                ) : (
                                    <div className="row g-3">
                                        {Object.entries(taxCalculations.section_104_pools || {}).map(([symbol, pool]: [string, any]) => (
                                            <div key={symbol} className="col-md-6 col-lg-4">
                                                <div className="card h-100">
                                                    <div className="card-body">
                                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                                            <h6 className="mb-0 fw-bold">{symbol}</h6>
                                                            <span className="badge bg-primary">Pool</span>
                                                        </div>
                                                        <div className="pool-details">
                                                            <div className="d-flex justify-content-between mb-2 pb-2 border-bottom">
                                                                <span className="text-muted">Quantity:</span>
                                                                <span className="fw-semibold">{pool.quantity || 0}</span>
                                                            </div>
                                                            <div className="d-flex justify-content-between mb-2 pb-2 border-bottom">
                                                                <span className="text-muted">Total Cost:</span>
                                                                <span className="fw-semibold">{formatCurrency(pool.total_cost || 0)}</span>
                                                            </div>
                                                            <div className="d-flex justify-content-between">
                                                                <span className="text-muted">Average Cost:</span>
                                                                <span className="fw-semibold">
                                                                    {pool.quantity > 0
                                                                        ? formatCurrency((pool.total_cost || 0) / pool.quantity)
                                                                        : formatCurrency(0)
                                                                    }
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </Card>
        </div>
    );
};
