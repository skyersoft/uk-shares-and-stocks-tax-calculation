/**
 * Results Page JavaScript Module
 * Handles loading, displaying, and managing tax calculation results
 * Follows modern JavaScript best practices with separation of concerns
 */

// Make ResultsManager available globally for testing
window.ResultsManager = class ResultsManager {
    constructor() {
        this.elements = {};
        this.data = null;
        this.init();
    }

    /**
     * Initialize the results manager
     */
    init() {
        console.log('Results page loading...');
        this.cacheElements();
        this.loadAndDisplayResults();
    }

    /**
     * Cache DOM elements for better performance
     */
    cacheElements() {
        this.elements = {
            loadingIndicator: document.getElementById('loadingIndicator'),
            errorDisplay: document.getElementById('errorDisplay'),
            resultsHeader: document.getElementById('resultsHeader'),
            resultsContent: document.getElementById('resultsContent'),
            callToAction: document.getElementById('callToAction'),
            taxYearDisplay: document.getElementById('taxYearDisplay'),
            cgtWarning: document.getElementById('cgtWarning'),
            totalTaxLiability: document.getElementById('totalTaxLiability'),
            portfolioValue: document.getElementById('portfolioValue'),
            totalReturn: document.getElementById('totalReturn'),
            disposalsTableBody: document.getElementById('disposals-table-body'),
            dividendsTableBody: document.getElementById('dividends-table-body'),
            portfolioTableBody: document.getElementById('portfolio-table-body'),
            disposalsCount: document.getElementById('disposals-count'),
            dividendsCount: document.getElementById('dividends-count'),
            portfolioCount: document.getElementById('portfolio-count')
        };
    }

    /**
     * Main method to load and display results
     */
    async loadAndDisplayResults() {
        try {
            this.showLoading();
            const urlParams = new URLSearchParams(window.location.search);
            const resultId = urlParams.get('id');
            const cacheBuster = urlParams.get('v'); // Cache buster

            if (!resultId) {
                this.showError('No calculation ID found in the URL. Please return to the calculator and try again.', true);
                return;
            }

            // Always fetch fresh data if a cache buster is present
            const storedItem = localStorage.getItem(`tax_result_${resultId}`);
            if (storedItem && !cacheBuster) {
                const stored = JSON.parse(storedItem);
                this.data = stored.data;
                console.log('Using stored calculation results:', this.data);
                
                // DEBUG: Check what's actually in localStorage
                console.log('[STORAGE] Raw localStorage data size:', storedItem.length);
                console.log('[STORAGE] Holdings in stored data:');
                const marketSummaries = this.data?.portfolio_analysis?.market_summaries;
                if (marketSummaries) {
                    Object.keys(marketSummaries).forEach(marketKey => {
                        const holdings = marketSummaries[marketKey]?.holdings;
                        if (holdings) {
                            console.log(`[STORAGE] Market ${marketKey}: ${holdings.length} holdings`);
                            holdings.forEach((h, i) => {
                                console.log(`[STORAGE]   ${i}: ${h.security?.symbol} qty=${h.quantity}`);
                            });
                        }
                    });
                }
                
                this.displayResults();
            } else if (storedItem) {
                const stored = JSON.parse(storedItem);
                this.data = stored.data;
                console.log('Using fresh calculation results (cache busted):', this.data);
                
                // DEBUG: Check what's actually in localStorage  
                console.log('[STORAGE] Raw localStorage data size:', storedItem.length);
                console.log('[STORAGE] Holdings in stored data:');
                const marketSummaries = this.data?.portfolio_analysis?.market_summaries;
                if (marketSummaries) {
                    Object.keys(marketSummaries).forEach(marketKey => {
                        const holdings = marketSummaries[marketKey]?.holdings;
                        if (holdings) {
                            console.log(`[STORAGE] Market ${marketKey}: ${holdings.length} holdings`);
                            holdings.forEach((h, i) => {
                                console.log(`[STORAGE]   ${i}: ${h.security?.symbol} qty=${h.quantity}`);
                            });
                        }
                    });
                }
                
                this.displayResults();
            } else {
                this.showError('Could not find calculation results. The data may have expired. Please return to the calculator and try again.', true);
            }
        } catch (error) {
            console.error('Error loading or displaying results:', error);
            this.showError('A critical error occurred while loading your results. Please return to the calculator and try again.', true);
        }
    }

    showLoading() {
        if (this.elements.loadingIndicator) this.elements.loadingIndicator.style.display = 'block';
        if (this.elements.resultsContent) this.elements.resultsContent.style.display = 'none';
        if (this.elements.errorDisplay) this.elements.errorDisplay.style.display = 'none';
    }

    showError(message, showReturnButton = false) {
        if (this.elements.loadingIndicator) this.elements.loadingIndicator.style.display = 'none';
        if (this.elements.resultsContent) this.elements.resultsContent.style.display = 'none';
        if (this.elements.errorDisplay) {
            this.elements.errorDisplay.style.display = 'block';
            const errorMsg = this.elements.errorDisplay.querySelector('p');
            if (errorMsg) errorMsg.textContent = message;
        }
    }

    displayResults() {
        if (!this.data) {
            this.showError('Calculation data is missing or invalid.');
            return;
        }

        try {
            console.log('Rendering results with data:', this.data);
            
            // DEBUG: Check if we have the expected holdings structure
            const marketSummaries = this.data?.portfolio_analysis?.market_summaries;
            if (marketSummaries) {
                Object.keys(marketSummaries).forEach(marketKey => {
                    const holdings = marketSummaries[marketKey]?.holdings;
                    if (holdings) {
                        console.log(`[VERIFY] Market ${marketKey} has ${holdings.length} holdings:`);
                        holdings.forEach((h, i) => {
                            console.log(`  ${i}: ${h.security?.symbol} qty=${h.quantity}`);
                        });
                    }
                });
            }

            // Normalize incoming API shapes to unified arrays the UI expects
            this.normalized = this.normalizeData(this.data);

            // Hide loading/error, show content
            if (this.elements.loadingIndicator) this.elements.loadingIndicator.style.display = 'none';
            if (this.elements.errorDisplay) this.elements.errorDisplay.style.display = 'none';
            if (this.elements.resultsHeader) this.elements.resultsHeader.style.display = 'block';
            if (this.elements.resultsContent) this.elements.resultsContent.style.display = 'block';
            if (this.elements.callToAction) this.elements.callToAction.style.display = 'block';

            // Populate UI
            this.updateTaxYear();
            this.populateMetrics();
            this.populateAllTables();
            
            // Debug logging to help diagnose empty tables
            console.log('Normalized data summary:', {
                disposals: this.normalized.disposals.length,
                dividends: this.normalized.dividends.length,
                holdings: this.normalized.holdings.length,
                rawKeys: Object.keys(this.data || {})
            });
            
            if (this.normalized.disposals.length === 0 && this.normalized.dividends.length === 0 && this.normalized.holdings.length === 0) {
                // Insert a visible warning once
                if (!document.getElementById('emptyDataWarning')) {
                    const warn = document.createElement('div');
                    warn.id = 'emptyDataWarning';
                    warn.className = 'alert alert-warning mt-3';
                    warn.innerHTML = '<strong>No detailed rows rendered.</strong> Data object may be truncated or script cached. Try recalculating or hard-refresh (Shift+Reload).';
                    if (this.elements.resultsContent) {
                        this.elements.resultsContent.prepend(warn);
                    }
                }
            }
            
            window.__normalizedResults = this.normalized; // expose for test debugging
            this._maybeShowDiscrepancyBanner();
            
        } catch (error) {
            console.error('Error in displayResults:', error);
            this.showError('Failed to display results. Please try again.');
        }
    }

    updateTaxYear() {
        const taxYear = this.data.tax_year || 'N/A';
        if (this.elements.taxYearDisplay) {
            this.elements.taxYearDisplay.textContent = `Tax Year: ${taxYear}`;
        }
        if (taxYear === '2024-2025' && this.elements.cgtWarning) {
            this.elements.cgtWarning.style.display = 'block';
        }
    }

    populateMetrics() {
        const taxReport = this.data.tax_report || {};
        const portfolioReport = this.data.portfolio_report || {};

        const totalTax = taxReport.summary?.estimated_tax_liability?.total_estimated_tax ?? 0;
        const portfolioValue = portfolioReport.grand_total?.total_value ?? 0;
        const returnPct = portfolioReport.grand_total?.total_return_pct ?? 0;

        if (this.elements.totalTaxLiability) this.elements.totalTaxLiability.textContent = this.formatCurrency(totalTax);
        if (this.elements.portfolioValue) this.elements.portfolioValue.textContent = this.formatCurrency(portfolioValue);
        if (this.elements.totalReturn) this.elements.totalReturn.textContent = this.formatPercentage(returnPct);
    }

    populateAllTables() {
        this.populateDisposalsTable();
        this.populateDividendsTable();
        this.populatePortfolioTable();
    }

    populateDisposalsTable() {
        const tableBody = this.elements.disposalsTableBody;
        const disposals = this.normalized?.disposals || [];
        if (this.elements.disposalsCount) this.elements.disposalsCount.textContent = disposals.length;

        if (!tableBody) return;
        if (disposals.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No disposals found</td></tr>';
            return;
        }
        tableBody.innerHTML = disposals.map(d => this.createDisposalRow(d)).join('');
    }

    createDisposalRow(disposal) {
        const gainLoss = disposal.gain_or_loss ?? (disposal.gain_loss ?? 0);
        // Support legacy 'sell_date' field
        const rawDate = disposal.disposal_date || disposal.sell_date || '';
        const datePart = rawDate.includes('T') ? rawDate.split('T')[0] : rawDate.split(' ')[0] || 'N/A';
        return `
            <tr>
                <td>${datePart}</td>
                <td>${disposal.security?.symbol || 'N/A'}</td>
                <td>${disposal.quantity || 0}</td>
                <td>${this.formatCurrency(disposal.proceeds || 0)}</td>
                <td>${this.formatCurrency(disposal.cost_basis || 0)}</td>
                <td class="${gainLoss >= 0 ? 'text-success' : 'text-danger'}">${this.formatCurrency(gainLoss)}</td>
            </tr>`;
    }

    populateDividendsTable() {
        const tableBody = this.elements.dividendsTableBody;
        const dividends = this.normalized?.dividends || [];
        if (this.elements.dividendsCount) this.elements.dividendsCount.textContent = dividends.length;

        if (!tableBody) return;
        if (dividends.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No dividends found</td></tr>';
            return;
        }
        tableBody.innerHTML = dividends.map(d => this.createDividendRow(d)).join('');
    }

    createDividendRow(dividend) {
        const grossAmount = dividend.amount_gbp ?? 0;
        const withholding = dividend.withholding_tax_gbp ?? 0;
        const netAmount = grossAmount - withholding;
        const rawDate = dividend.payment_date || '';
        const datePart = rawDate.includes('T') ? rawDate.split('T')[0] : rawDate.split(' ')[0] || 'N/A';
        return `
            <tr>
                <td>${datePart}</td>
                <td>${dividend.security?.symbol || 'N/A'} - ${dividend.security?.name || ''}</td>
                <td>${this.formatCurrency(grossAmount)}</td>
                <td>${this.formatCurrency(withholding)}</td>
                <td>${this.formatCurrency(netAmount)}</td>
            </tr>`;
    }

    populatePortfolioTable() {
        const tableBody = this.elements.portfolioTableBody;
        const holdings = this.normalized?.holdings || [];
        if (this.elements.portfolioCount) this.elements.portfolioCount.textContent = holdings.length;

        if (!tableBody) return;
        if (holdings.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No portfolio holdings found</td></tr>';
            return;
        }
        tableBody.innerHTML = holdings.map(h => this.createHoldingRow(h)).join('');
    }

    createHoldingRow(holding) {
        // Derive total cost if not explicitly present
        const avgCost = holding.average_cost_gbp || 0;
        const qty = holding.quantity || 0;
        const explicitTotalCost = holding.total_cost_gbp;
        const totalCost = explicitTotalCost != null ? explicitTotalCost : (avgCost * qty);
        const unrealizedGain = holding.unrealized_gain_loss ?? 0;
        // Prefer backend-provided total_return_pct if available, otherwise compute
        const backendReturnPct = holding.total_return_pct;
        const computedReturnPct = totalCost > 0 ? (unrealizedGain / totalCost * 100) : 0;
        const returnPct = (backendReturnPct != null && !isNaN(Number(backendReturnPct))) ? backendReturnPct : computedReturnPct;
        return `
            <tr>
                <td>${holding.security?.symbol || holding.symbol_fallback || 'N/A'}</td>
                <td>${holding.quantity || 0}</td>
                <td>${this.formatCurrency(holding.average_cost_gbp || 0)}</td>
                <td>${this.formatCurrency(holding.current_value_gbp || 0)}</td>
                <td class="${unrealizedGain >= 0 ? 'text-success' : 'text-danger'}">${this.formatCurrency(unrealizedGain)}</td>
                <td class="${returnPct >= 0 ? 'text-success' : 'text-danger'}">${this.formatPercentage(returnPct)}</td>
            </tr>`;
    }

    formatCurrency(value) {
        const numValue = Number(value) || 0;
        return `£${numValue.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    formatPercentage(value) {
        const numValue = Number(value) || 0;
        return `${numValue.toFixed(2)}%`;
    }

    /**
     * Normalize varying backend response schemas into a consistent structure
     * Supports legacy/new shapes without breaking older stored results
     * Expected unified shape:
     *   disposals: [ { disposal_date, security: { symbol }, quantity, proceeds, cost_basis, gain_or_loss } ]
     *   dividends: [ { payment_date, security: { symbol, name }, amount_gbp, withholding_tax_gbp } ]
     *   holdings:  [ { security: { symbol }, quantity, average_cost_gbp, current_value_gbp, unrealized_gain_loss } ]
     */
    normalizeData(raw) {
        const normalized = { disposals: [], dividends: [], holdings: [] };
        const debugMeta = { originalHoldingsCount: 0, discoveredHoldingsPaths: [] };



        try {
            // Disposals: prefer tax_analysis.capital_gains.disposals; fallback tax_report.disposals
            const disposals = raw?.tax_analysis?.capital_gains?.disposals
                || raw?.tax_report?.disposals
                || [];
                
            if (Array.isArray(disposals)) {
                normalized.disposals = disposals.map(d => ({
                    ...d,
                    disposal_date: d.disposal_date || d.sell_date || d.date || null
                }));
            }

            // Dividends: prefer tax_analysis.dividend_income.dividends; fallback tax_report.dividend_income.dividends
            const dividends = raw?.tax_analysis?.dividend_income?.dividends
                || raw?.tax_report?.dividend_income?.dividends
                || [];
                
            if (Array.isArray(dividends)) normalized.dividends = dividends;

            // Holdings: prefer portfolio_analysis.market_summaries.*.holdings flattened
            let holdings = [];
            const marketSummaries = raw?.portfolio_analysis?.market_summaries;
            
            if (marketSummaries && typeof marketSummaries === 'object') {
                Object.entries(marketSummaries).forEach(([marketKey, market]) => {
                    if (Array.isArray(market?.holdings)) {
                        const marketHoldings = market.holdings.map(h => {
                            const security = h.security || { symbol: h.symbol, name: h.name };
                            const avgCost = h.average_cost_gbp || h.avg_cost_gbp || h.average_cost || 0;
                            const quantity = h.quantity || 0;
                            const currentValue = h.current_value_gbp || h.current_value || h.value || 0;
                            const totalCost = h.total_cost_gbp != null ? h.total_cost_gbp : (avgCost * quantity);
                            const unrealized = h.unrealized_gain_loss != null ? h.unrealized_gain_loss : (currentValue - totalCost);
                            const backendReturn = h.total_return_pct;
                            const computedReturn = totalCost > 0 ? (unrealized / totalCost * 100) : 0;
                            
                            // Enhanced symbol extraction with proper empty string handling
                            const extractSymbol = () => {
                                // Try various symbol fields, filtering out empty strings
                                const candidates = [
                                    security?.symbol,
                                    security?.ticker,
                                    security?.security_id,
                                    security?.cusip,
                                    security?.isin,
                                    h.symbol,
                                    h.ticker,
                                    h.code,
                                    h.security_id
                                ].filter(s => s && s.trim() !== '');
                                
                                // If no valid symbol found and this appears to be an aggregated holding
                                // (high quantity suggesting multiple securities), show appropriate label
                                if (candidates.length === 0) {
                                    return quantity > 100 ? 'MIXED PORTFOLIO' : 'UNKNOWN';
                                }
                                
                                return candidates[0];
                            };
                            
                            return {
                                security,
                                symbol_fallback: extractSymbol(),
                                quantity,
                                average_cost_gbp: avgCost,
                                current_value_gbp: currentValue,
                                total_cost_gbp: totalCost,
                                unrealized_gain_loss: unrealized,
                                total_return_pct: backendReturn != null ? backendReturn : computedReturn
                            };
                        });
                        
                        holdings = holdings.concat(marketHoldings);
                    }
                });
            }

            // Fallback: portfolio_report.holdings (if future schema provides) or portfolio_report.markets.*.holdings simplified
            if (holdings.length === 0) {
                if (Array.isArray(raw?.portfolio_report?.holdings)) {
                    holdings = raw.portfolio_report.holdings.map(h => {
                        const avgCost = h.avg_cost_gbp || h.average_cost_gbp || h.average_cost || 0;
                        const quantity = h.quantity || 0;
                        const currentValue = h.value || h.current_value_gbp || h.current_value || 0;
                        const totalCost = h.total_cost_gbp != null ? h.total_cost_gbp : (avgCost * quantity);
                        const unrealized = h.unrealized_gain_loss != null ? h.unrealized_gain_loss : (currentValue - totalCost);
                        const backendReturn = h.total_return_pct;
                        const computedReturn = totalCost > 0 ? (unrealized / totalCost * 100) : 0;
                        return {
                            security: { symbol: h.symbol, name: h.name },
                            symbol_fallback: h.symbol,
                            quantity,
                            average_cost_gbp: avgCost,
                            current_value_gbp: currentValue,
                            total_cost_gbp: totalCost,
                            unrealized_gain_loss: unrealized,
                            total_return_pct: backendReturn != null ? backendReturn : computedReturn
                        };
                    });
                } else if (raw?.portfolio_report?.markets) {
                    Object.values(raw.portfolio_report.markets).forEach(market => {
                        if (Array.isArray(market?.holdings)) holdings = holdings.concat(
                            market.holdings.map(h => {
                                const avgCost = h.avg_cost_gbp || h.average_cost_gbp || h.average_cost || 0;
                                const quantity = h.quantity || 0;
                                const currentValue = h.value || h.current_value_gbp || h.current_value || 0;
                                const totalCost = h.total_cost_gbp != null ? h.total_cost_gbp : (avgCost * quantity);
                                const unrealized = h.unrealized_gain_loss != null ? h.unrealized_gain_loss : (currentValue - totalCost);
                                const backendReturn = h.total_return_pct;
                                const computedReturn = totalCost > 0 ? (unrealized / totalCost * 100) : 0;
                                return {
                                    security: { symbol: h.symbol, name: h.name },
                                    symbol_fallback: h.symbol,
                                    quantity,
                                    average_cost_gbp: avgCost,
                                    current_value_gbp: currentValue,
                                    total_cost_gbp: totalCost,
                                    unrealized_gain_loss: unrealized,
                                    total_return_pct: backendReturn != null ? backendReturn : computedReturn
                                };
                            })
                        );
                    });
                }
            }

            // Deep fallback: if still zero holdings, scan entire raw object recursively for any 'holdings' arrays of objects with security/quantity keys
            const deepSearchHoldings = [];
            const visited = new Set();
            function scan(obj, path) {
                if (!obj || typeof obj !== 'object' || visited.has(obj)) return;
                visited.add(obj);
                if (Array.isArray(obj)) {
                    obj.forEach((item, idx) => scan(item, `${path}[${idx}]`));
                } else {
                    Object.entries(obj).forEach(([k, v]) => {
                        const newPath = path ? `${path}.${k}` : k;
                        if (k === 'holdings' && Array.isArray(v) && v.length && typeof v[0] === 'object') {
                            debugMeta.discoveredHoldingsPaths.push(newPath);
                            v.forEach(h => deepSearchHoldings.push(h));
                        }
                        scan(v, newPath);
                    });
                }
            }
            if (holdings.length === 0) {
                scan(raw, 'root');
            }
            if (holdings.length === 0 && deepSearchHoldings.length) {
                // Attempt to normalize deepSearchHoldings similarly
                holdings = deepSearchHoldings.map(h => {
                    const security = h.security || { symbol: h.symbol, name: h.name };
                    const avgCost = h.average_cost_gbp || h.avg_cost_gbp || h.average_cost || 0;
                    const quantity = h.quantity || 0;
                    const currentValue = h.current_value_gbp || h.current_value || h.value || 0;
                    const totalCost = h.total_cost_gbp != null ? h.total_cost_gbp : (avgCost * quantity);
                    const unrealized = h.unrealized_gain_loss != null ? h.unrealized_gain_loss : (currentValue - totalCost);
                    const backendReturn = h.total_return_pct;
                    const computedReturn = totalCost > 0 ? (unrealized / totalCost * 100) : 0;
                    return {
                        security,
                        symbol_fallback: security?.symbol || h.symbol || h.ticker || h.code || null,
                        quantity,
                        average_cost_gbp: avgCost,
                        current_value_gbp: currentValue,
                        total_cost_gbp: totalCost,
                        unrealized_gain_loss: unrealized,
                        total_return_pct: backendReturn != null ? backendReturn : computedReturn
                    };
                });
            }

            normalized.holdings = holdings;
            debugMeta.originalHoldingsCount = holdings.length;
        } catch (e) {
            console.warn('Normalization error; proceeding with partial data:', e);
        }

        try {
            console.log('[ResultsNormalization] Summary:', {
                disposals: normalized.disposals.length,
                dividends: normalized.dividends.length,
                holdings: normalized.holdings.length,
                rawKeys: Object.keys(raw || {}),
                meta: debugMeta
            });
        } catch (_) { /* ignore logging errors */ }
        return normalized;
    }

    _countAnyHoldings(raw) {
        let count = 0;
        const visited = new Set();
        function scan(obj) {
            if (!obj || typeof obj !== 'object' || visited.has(obj)) return;
            visited.add(obj);
            if (Array.isArray(obj)) {
                obj.forEach(scan);
            } else {
                Object.entries(obj).forEach(([k, v]) => {
                    if (k === 'holdings' && Array.isArray(v)) count += v.length;
                    scan(v);
                });
            }
        }
        scan(raw);
        return count;
    }

    _maybeShowDiscrepancyBanner() {
        try {
            if (typeof this.originalHoldingsCount === 'number' && this.normalized?.holdings) {
                if (this.originalHoldingsCount > this.normalized.holdings.length) {
                    if (!document.getElementById('holdingsDiscrepancyBanner')) {
                        const banner = document.createElement('div');
                        banner.id = 'holdingsDiscrepancyBanner';
                        banner.className = 'alert alert-info mt-3';
                        banner.innerHTML = `<strong>Diagnostic:</strong> Original data appears to contain <code>${this.originalHoldingsCount}</code> holdings, but only <code>${this.normalized.holdings.length}</code> rendered. This suggests a normalization path issue.`;
                        if (this.elements.resultsContent) {
                            this.elements.resultsContent.prepend(banner);
                        }
                    }
                }
            }
        } catch (e) { /* ignore */ }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.resultsManager = new window.ResultsManager();
});
