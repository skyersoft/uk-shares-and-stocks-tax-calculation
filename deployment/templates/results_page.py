"""Results page template with advertisement integration."""

def get_results_page_html(results, tax_year):
    """Generate the results page HTML with ads and comprehensive analysis."""

    # Extract key metrics
    tax_analysis = results.get('tax_analysis')
    portfolio_analysis = results.get('portfolio_analysis')
    portfolio_report = results.get('portfolio_report')
    tax_report = results.get('tax_report')

    # Calculate summary metrics
    total_tax_liability = 0
    total_portfolio_value = 0
    total_return_pct = 0

    # Extract tax liability
    if tax_analysis and hasattr(tax_analysis, 'total_tax_liability'):
        total_tax_liability = tax_analysis.total_tax_liability

    # Extract portfolio metrics
    if portfolio_analysis:
        # PortfolioSummary object has these exact attributes
        if hasattr(portfolio_analysis, 'total_portfolio_value'):
            total_portfolio_value = portfolio_analysis.total_portfolio_value
        elif hasattr(portfolio_analysis, 'total_value'):
            total_portfolio_value = portfolio_analysis.total_value
        elif isinstance(portfolio_analysis, dict):
            total_portfolio_value = portfolio_analysis.get('total_portfolio_value', 0)

        if hasattr(portfolio_analysis, 'total_return_pct'):
            total_return_pct = portfolio_analysis.total_return_pct
        elif hasattr(portfolio_analysis, 'total_return_percentage'):
            total_return_pct = portfolio_analysis.total_return_percentage
        elif isinstance(portfolio_analysis, dict):
            total_return_pct = portfolio_analysis.get('total_return_pct', 0)

    # Generate detailed analysis content
    tax_analysis_content = generate_tax_analysis_content(tax_analysis, tax_report, results)
    portfolio_analysis_content = generate_portfolio_analysis_content(portfolio_analysis, portfolio_report)
    
    return f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tax Calculation Results - {tax_year} | IBKR Tax Calculator</title>
    <meta name="description" content="Your UK tax calculation results for {tax_year}. Capital gains tax, dividend income, and portfolio analysis.">
    
    <!-- Google AdSense -->
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-YOUR_ADSENSE_ID"
            crossorigin="anonymous"></script>
    
    <!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
    
    <!-- Chart.js -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    
    <!-- Custom CSS -->
    <style>
        .metric-card {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 15px;
            padding: 20px;
            margin-bottom: 20px;
        }}
        .metric-value {{
            font-size: 2rem;
            font-weight: bold;
        }}
        .ad-container {{
            margin: 20px 0;
            text-align: center;
        }}
        .results-section {{
            margin-bottom: 30px;
        }}
        .table-responsive {{
            border-radius: 10px;
            overflow: hidden;
        }}
        .btn-download {{
            background: linear-gradient(45deg, #28a745, #20c997);
            border: none;
            color: white;
        }}
        .btn-download:hover {{
            background: linear-gradient(45deg, #218838, #1ea080);
            color: white;
        }}
    </style>
</head>
<body>
    <!-- Navigation -->
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
        <div class="container">
            <a class="navbar-brand" href="/">IBKR Tax Calculator</a>
            <div class="navbar-nav ms-auto">
                <a class="nav-link" href="/">New Calculation</a>
                <a class="nav-link" href="/about">About</a>
            </div>
        </div>
    </nav>

    <!-- Results Header -->
    <section class="bg-primary text-white py-4">
        <div class="container">
            <div class="row align-items-center">
                <div class="col-md-8">
                    <h1 class="display-6 mb-0">Tax Calculation Results</h1>
                    <p class="lead mb-0">Tax Year: {tax_year}</p>
                </div>
                <div class="col-md-4 text-end">
                    <button class="btn btn-light btn-lg" onclick="window.print()">
                        <i class="fas fa-print me-2"></i>Print Results
                    </button>
                </div>
            </div>
        </div>
    </section>

    <!-- Top Banner Ad -->
    <div class="container mt-3">
        <div class="ad-container">
            <ins class="adsbygoogle"
                 style="display:block"
                 data-ad-client="ca-pub-YOUR_ADSENSE_ID"
                 data-ad-slot="YOUR_RESULTS_BANNER_SLOT_ID"
                 data-ad-format="auto"
                 data-full-width-responsive="true"></ins>
            <script>
                 (adsbygoogle = window.adsbygoogle || []).push({{}});
            </script>
        </div>
    </div>

    <!-- Key Metrics -->
    <section class="py-4">
        <div class="container">
            <div class="row">
                <div class="col-md-4">
                    <div class="metric-card text-center">
                        <h5>Total Tax Liability</h5>
                        <div class="metric-value">£{total_tax_liability:,.2f}</div>
                        <small>Estimated tax due</small>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="metric-card text-center">
                        <h5>Portfolio Value</h5>
                        <div class="metric-value">£{total_portfolio_value:,.2f}</div>
                        <small>Current holdings value</small>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="metric-card text-center">
                        <h5>Total Return</h5>
                        <div class="metric-value">{total_return_pct:+.2f}%</div>
                        <small>Portfolio performance</small>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Main Content -->
    <div class="container">
        <div class="row">
            <!-- Main Results Column -->
            <div class="col-lg-8">
                <!-- Tax Analysis Section -->
                <div class="results-section">
                    <div class="card">
                        <div class="card-header bg-primary text-white">
                            <h4 class="mb-0">Tax Analysis - {tax_year}</h4>
                        </div>
                        <div class="card-body">
                            {tax_analysis_content}
                        </div>
                    </div>
                </div>

                <!-- Portfolio Analysis Section -->
                <div class="results-section">
                    <div class="card">
                        <div class="card-header bg-success text-white">
                            <h4 class="mb-0">Portfolio Analysis</h4>
                        </div>
                        <div class="card-body">
                            {portfolio_analysis_content}
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Sidebar with Ads and Recommendations -->
            <div class="col-lg-4">
                <!-- Sidebar Ad -->
                <div class="ad-container">
                    <ins class="adsbygoogle"
                         style="display:block"
                         data-ad-client="ca-pub-YOUR_ADSENSE_ID"
                         data-ad-slot="YOUR_SIDEBAR_SLOT_ID"
                         data-ad-format="auto"
                         data-full-width-responsive="true"></ins>
                    <script>
                         (adsbygoogle = window.adsbygoogle || []).push({{}});
                    </script>
                </div>
                
                <!-- Tax Planning Tips -->
                <div class="card mb-4">
                    <div class="card-header bg-success text-white">
                        <h6 class="mb-0">Tax Planning Tips</h6>
                    </div>
                    <div class="card-body">
                        <ul class="list-unstyled">
                            <li class="mb-2">
                                <i class="fas fa-lightbulb text-warning me-2"></i>
                                Consider using your annual CGT allowance
                            </li>
                            <li class="mb-2">
                                <i class="fas fa-lightbulb text-warning me-2"></i>
                                Review dividend allowance utilization
                            </li>
                            <li class="mb-2">
                                <i class="fas fa-lightbulb text-warning me-2"></i>
                                Plan disposals across tax years
                            </li>
                        </ul>
                    </div>
                </div>
                
                <!-- Amazon Associates Recommendations -->
                <div class="card">
                    <div class="card-header">
                        <h6 class="mb-0">Recommended Resources</h6>
                    </div>
                    <div class="card-body">
                        <div class="mb-3">
                            <a href="https://amzn.to/YOUR_TAX_GUIDE_LINK" target="_blank" class="text-decoration-none">
                                <div class="d-flex align-items-center">
                                    <div class="bg-primary text-white d-flex align-items-center justify-content-center me-3" style="width: 50px; height: 70px; border-radius: 5px;"><i class="fas fa-book"></i></div>
                                    <div>
                                        <h6 class="mb-1 small">UK Tax Planning Guide</h6>
                                        <small class="text-muted">Expert tax strategies</small>
                                    </div>
                                </div>
                            </a>
                        </div>
                        
                        <div class="mb-3">
                            <a href="https://amzn.to/YOUR_PORTFOLIO_BOOK_LINK" target="_blank" class="text-decoration-none">
                                <div class="d-flex align-items-center">
                                    <div class="bg-success text-white d-flex align-items-center justify-content-center me-3" style="width: 50px; height: 70px; border-radius: 5px;"><i class="fas fa-chart-line"></i></div>
                                    <div>
                                        <h6 class="mb-1 small">Portfolio Management</h6>
                                        <small class="text-muted">Investment strategies</small>
                                    </div>
                                </div>
                            </a>
                        </div>
                        
                        <div class="mb-3">
                            <a href="https://amzn.to/YOUR_SOFTWARE_LINK" target="_blank" class="text-decoration-none">
                                <div class="d-flex align-items-center">
                                    <div class="bg-info text-white d-flex align-items-center justify-content-center me-3" style="width: 50px; height: 70px; border-radius: 5px;"><i class="fas fa-calculator"></i></div>
                                    <div>
                                        <h6 class="mb-1 small">Tax Software Pro</h6>
                                        <small class="text-muted">Professional tax tools</small>
                                    </div>
                                </div>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Bottom Banner Ad -->
    <div class="container my-4">
        <div class="ad-container">
            <ins class="adsbygoogle"
                 style="display:block"
                 data-ad-client="ca-pub-YOUR_ADSENSE_ID"
                 data-ad-slot="YOUR_BOTTOM_BANNER_SLOT_ID"
                 data-ad-format="auto"
                 data-full-width-responsive="true"></ins>
            <script>
                 (adsbygoogle = window.adsbygoogle || []).push({{}});
            </script>
        </div>
    </div>

    <!-- Call to Action -->
    <section class="bg-light py-5">
        <div class="container text-center">
            <h3>Need Another Calculation?</h3>
            <p class="lead">Calculate taxes for different years or update your portfolio analysis</p>
            <a href="/" class="btn btn-primary btn-lg me-3">New Calculation</a>
            <a href="/about" class="btn btn-outline-primary btn-lg">Learn More</a>
        </div>
    </section>

    <!-- Footer -->
    <footer class="bg-dark text-white py-4">
        <div class="container">
            <div class="row">
                <div class="col-md-6">
                    <p>&copy; 2024 IBKR Tax Calculator. All rights reserved.</p>
                    <small class="text-muted">This tool provides estimates only. Consult a tax professional for advice.</small>
                </div>
                <div class="col-md-6 text-end">
                    <a href="/privacy" class="text-white me-3">Privacy Policy</a>
                    <a href="/terms" class="text-white">Terms of Service</a>
                </div>
            </div>
        </div>
    </footer>

    <!-- Bootstrap JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
</body>
</html>
    """


def generate_tax_analysis_section(tax_analysis, tax_year):
    """Generate the tax analysis section HTML."""
    if not tax_analysis:
        return ""
    
    return f"""
    <div class="results-section">
        <div class="card">
            <div class="card-header bg-primary text-white">
                <h4 class="mb-0">Tax Analysis - {tax_year}</h4>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-6">
                        <h6>Capital Gains Tax</h6>
                        <p>Taxable Gain: £{getattr(tax_analysis, 'taxable_gain', 0):,.2f}</p>
                        <p>Annual Exemption Used: £{getattr(tax_analysis, 'annual_exemption_used', 0):,.2f}</p>
                    </div>
                    <div class="col-md-6">
                        <h6>Dividend Income</h6>
                        <p>Total Dividends: £{getattr(tax_analysis.dividend_income, 'total_gross_gbp', 0) if hasattr(tax_analysis, 'dividend_income') and tax_analysis.dividend_income else 0:,.2f}</p>
                        <p>Dividend Allowance Used: £{getattr(tax_analysis, 'dividend_allowance_used', 0):,.2f}</p>
                    </div>
                </div>
                
                <div class="mt-3">
                    <h6>Tax Summary</h6>
                    <div class="table-responsive">
                        <table class="table table-striped">
                            <thead>
                                <tr>
                                    <th>Income Type</th>
                                    <th>Amount</th>
                                    <th>Tax Rate</th>
                                    <th>Tax Due</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Capital Gains</td>
                                    <td>£{getattr(tax_analysis, 'taxable_gain', 0):,.2f}</td>
                                    <td>10%/20%</td>
                                    <td>£{(getattr(tax_analysis, 'taxable_gain', 0) * 0.10):,.2f}</td>
                                </tr>
                                <tr>
                                    <td>Dividend Income</td>
                                    <td>£{getattr(tax_analysis.dividend_income, 'taxable_dividend_income', 0) if hasattr(tax_analysis, 'dividend_income') and tax_analysis.dividend_income else 0:,.2f}</td>
                                    <td>8.75%/33.75%</td>
                                    <td>£{(getattr(tax_analysis.dividend_income, 'taxable_dividend_income', 0) * 0.0875) if hasattr(tax_analysis, 'dividend_income') and tax_analysis.dividend_income else 0:,.2f}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
    """


def generate_portfolio_analysis_section(portfolio_analysis, portfolio_report):
    """Generate the portfolio analysis section HTML."""
    if not portfolio_analysis:
        return ""
    
    return f"""
    <div class="results-section">
        <div class="card">
            <div class="card-header bg-success text-white">
                <h4 class="mb-0">Portfolio Analysis</h4>
            </div>
            <div class="card-body">
                <div class="row mb-3">
                    <div class="col-md-4">
                        <h6>Total Holdings</h6>
                        <p class="h5">{portfolio_analysis.number_of_holdings}</p>
                    </div>
                    <div class="col-md-4">
                        <h6>Markets</h6>
                        <p class="h5">{portfolio_analysis.number_of_markets}</p>
                    </div>
                    <div class="col-md-4">
                        <h6>Total Value</h6>
                        <p class="h5">£{portfolio_analysis.total_portfolio_value:,.2f}</p>
                    </div>
                </div>
                
                <h6>Holdings by Market</h6>
                <div class="table-responsive">
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>Market</th>
                                <th>Holdings</th>
                                <th>Value</th>
                                <th>Weight</th>
                                <th>Return</th>
                            </tr>
                        </thead>
                        <tbody>
                            {generate_market_rows(portfolio_analysis)}
                        </tbody>
                    </table>
                </div>
                
                <div class="mt-3">
                    <p class="text-muted">Portfolio charts will be available in a future update.</p>
                </div>
            </div>
        </div>
    </div>
    """


def generate_market_rows(portfolio_analysis):
    """Generate table rows for market summaries."""
    rows = ""
    for market, summary in portfolio_analysis.market_summaries.items():
        return_pct = (summary.total_unrealized_gain_loss / summary.total_cost * 100) if summary.total_cost > 0 else 0
        rows += f"""
        <tr>
            <td>{market}</td>
            <td>{summary.number_of_holdings}</td>
            <td>£{summary.total_value:,.2f}</td>
            <td>{summary.weight_in_portfolio:.1f}%</td>
            <td class="{'text-success' if return_pct >= 0 else 'text-danger'}">{return_pct:+.2f}%</td>
        </tr>
        """
    return rows


def get_market_labels(portfolio_analysis):
    """Get market labels for chart."""
    return list(portfolio_analysis.market_summaries.keys())


def get_market_values(portfolio_analysis):
    """Get market values for chart."""
    return [summary.total_value for summary in portfolio_analysis.market_summaries.values()]


def generate_tax_analysis_content(tax_analysis, tax_report, results=None):
    """Generate detailed tax analysis content."""
    if not tax_analysis:
        return "<p>No tax analysis data available.</p>"

    content = f"""
    <div class="row mb-4">
        <div class="col-md-6">
            <h5>Capital Gains Summary</h5>
            <table class="table table-sm">
                <tr><td>Total Gains:</td><td>£{getattr(tax_analysis, 'total_gains', 0):,.2f}</td></tr>
                <tr><td>Total Losses:</td><td>£{getattr(tax_analysis, 'total_losses', 0):,.2f}</td></tr>
                <tr><td>Net Gain:</td><td>£{getattr(tax_analysis, 'net_gain', 0):,.2f}</td></tr>
                <tr><td>CGT Allowance Used:</td><td>£{getattr(tax_analysis, 'capital_gains_allowance_used', 0):,.2f}</td></tr>
                <tr><td><strong>Taxable Gain:</strong></td><td><strong>£{getattr(tax_analysis, 'taxable_gain', 0):,.2f}</strong></td></tr>
            </table>
        </div>
        <div class="col-md-6">
            <h5>Dividend Income Summary</h5>
            <table class="table table-sm">
                <tr><td>Total Dividend Income (Gross):</td><td>£{getattr(tax_analysis.dividend_income, 'total_gross_gbp', 0) if hasattr(tax_analysis, 'dividend_income') and tax_analysis.dividend_income else 0:,.2f}</td></tr>
                <tr><td>Total Dividend Income (Net):</td><td>£{getattr(tax_analysis.dividend_income, 'total_net_gbp', 0) if hasattr(tax_analysis, 'dividend_income') and tax_analysis.dividend_income else 0:,.2f}</td></tr>
                <tr><td>Dividend Allowance Used:</td><td>£{getattr(tax_analysis.dividend_income, 'dividend_allowance_used', 0) if hasattr(tax_analysis, 'dividend_income') and tax_analysis.dividend_income else 0:,.2f}</td></tr>
                <tr><td>Taxable Dividend Income:</td><td>£{getattr(tax_analysis.dividend_income, 'taxable_dividend_income', 0) if hasattr(tax_analysis, 'dividend_income') and tax_analysis.dividend_income else 0:,.2f}</td></tr>
            </table>
        </div>
    </div>

    <div class="row mb-4">
        <div class="col-md-12">
            <h5>Tax Breakdown</h5>
            <table class="table table-sm">
                <tr><td>Capital Gains Tax (10%):</td><td>£{getattr(tax_analysis, 'taxable_gain', 0) * 0.10:,.2f}</td></tr>
                <tr><td>Dividend Tax (8.75%):</td><td>£{(getattr(tax_analysis.dividend_income, 'taxable_dividend_income', 0) * 0.0875) if hasattr(tax_analysis, 'dividend_income') and tax_analysis.dividend_income else 0:,.2f}</td></tr>
                <tr><td><strong>Total Tax Liability:</strong></td><td><strong>£{tax_analysis.total_tax_liability:,.2f}</strong></td></tr>
            </table>
        </div>
    </div>
    """

    if hasattr(tax_analysis, 'disposals') and tax_analysis.disposals:
        content += """
        <h5>Disposal Details</h5>
        <div class="table-responsive">
            <table class="table table-striped">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Security</th>
                        <th>Quantity</th>
                        <th>Proceeds</th>
                        <th>Cost</th>
                        <th>Gain/Loss</th>
                    </tr>
                </thead>
                <tbody>
        """
        for disposal in tax_analysis.disposals[:10]:  # Show first 10 disposals
            content += f"""
                    <tr>
                        <td>{disposal.disposal_date.strftime('%Y-%m-%d') if hasattr(disposal, 'disposal_date') else 'N/A'}</td>
                        <td>{getattr(disposal.security, 'symbol', 'N/A') if hasattr(disposal, 'security') else 'N/A'}</td>
                        <td>{getattr(disposal, 'quantity', 0):,.0f}</td>
                        <td>£{getattr(disposal, 'proceeds', 0):,.2f}</td>
                        <td>£{getattr(disposal, 'cost_basis', 0):,.2f}</td>
                        <td class="{'text-success' if getattr(disposal, 'gain_or_loss', 0) > 0 else 'text-danger'}">£{getattr(disposal, 'gain_or_loss', 0):,.2f}</td>
                    </tr>
            """
        content += """
                </tbody>
            </table>
        </div>
        """

    # Add dividend details section
    if (hasattr(tax_analysis, 'dividend_income') and
        tax_analysis.dividend_income and
        hasattr(tax_analysis.dividend_income, 'dividends') and
        tax_analysis.dividend_income.dividends):

        content += """
        <h5>Dividend Details</h5>
        <div class="table-responsive">
            <table class="table table-striped">
                <thead>
                    <tr>
                        <th>Payment Date</th>
                        <th>Security</th>
                        <th>Gross Amount (GBP)</th>
                        <th>Withholding Tax (GBP)</th>
                        <th>Net Amount (GBP)</th>
                    </tr>
                </thead>
                <tbody>
        """

        for dividend in tax_analysis.dividend_income.dividends:
            net_amount = dividend.amount_gbp - dividend.withholding_tax_gbp
            content += f"""
                    <tr>
                        <td>{dividend.payment_date.strftime('%Y-%m-%d') if dividend.payment_date else 'N/A'}</td>
                        <td>{getattr(dividend.security, 'symbol', 'N/A')} - {getattr(dividend.security, 'name', 'N/A')}</td>
                        <td>£{dividend.amount_gbp:,.2f}</td>
                        <td>£{dividend.withholding_tax_gbp:,.2f}</td>
                        <td>£{net_amount:,.2f}</td>
                    </tr>
            """

        content += """
                </tbody>
            </table>
        </div>
        """

    # Add commission summary section if available
    commission_summary = results.get('commission_summary') if results else None
    if commission_summary:
        content += f"""
        <h5>Commission & Fees Summary</h5>
        <div class="row mb-4">
            <div class="col-md-6">
                <table class="table table-sm">
                    <tr><td>Total Commissions:</td><td>£{commission_summary.get('total_commissions', 0):,.2f}</td></tr>
                    <tr><td>Total Fees:</td><td>£{commission_summary.get('total_fees', 0):,.2f}</td></tr>
                    <tr><td><strong>Total Trading Costs:</strong></td><td><strong>£{commission_summary.get('total_costs', 0):,.2f}</strong></td></tr>
                </table>
            </div>
            <div class="col-md-6">
                <table class="table table-sm">
                    <tr><td>Buy Commissions:</td><td>£{commission_summary.get('breakdown', {}).get('buy_commissions', 0):,.2f}</td></tr>
                    <tr><td>Sell Commissions:</td><td>£{commission_summary.get('breakdown', {}).get('sell_commissions', 0):,.2f}</td></tr>
                    <tr><td>Transactions with Costs:</td><td>{commission_summary.get('transaction_count', 0)}</td></tr>
                </table>
            </div>
        </div>
        """

    return content


def generate_portfolio_analysis_content(portfolio_analysis, portfolio_report):
    """Generate detailed portfolio analysis content."""
    if not portfolio_analysis:
        return "<p>No portfolio analysis data available.</p>"

    content = f"""
    <div class="row mb-4">
        <div class="col-md-6">
            <h5>Portfolio Summary</h5>
            <table class="table table-sm">
                <tr><td>Total Value:</td><td>£{getattr(portfolio_analysis, 'total_portfolio_value', 0):,.2f}</td></tr>
                <tr><td>Total Cost:</td><td>£{getattr(portfolio_analysis, 'total_portfolio_cost', 0):,.2f}</td></tr>
                <tr><td>Unrealized P&L:</td><td class="{'text-success' if getattr(portfolio_analysis, 'total_unrealized_gain_loss', 0) > 0 else 'text-danger'}">£{getattr(portfolio_analysis, 'total_unrealized_gain_loss', 0):,.2f}</td></tr>
                <tr><td>Return %:</td><td class="{'text-success' if getattr(portfolio_analysis, 'total_return_pct', 0) > 0 else 'text-danger'}">{getattr(portfolio_analysis, 'total_return_pct', 0):+.2f}%</td></tr>
            </table>
        </div>
        <div class="col-md-6">
            <h5>Holdings Count</h5>
            <table class="table table-sm">
                <tr><td>Total Positions:</td><td>{getattr(portfolio_analysis, 'number_of_holdings', 0)}</td></tr>
                <tr><td>Number of Markets:</td><td>{getattr(portfolio_analysis, 'number_of_markets', 0)}</td></tr>
                <tr><td>Profitable Holdings:</td><td>{len([h for h in (portfolio_analysis.get_all_holdings() if hasattr(portfolio_analysis, 'get_all_holdings') else []) if getattr(h, 'unrealized_gain_loss', 0) > 0])}</td></tr>
            </table>
        </div>
    </div>
    """

    # Get holdings using the correct method
    all_holdings = []
    if hasattr(portfolio_analysis, 'get_all_holdings'):
        all_holdings = portfolio_analysis.get_all_holdings()
    elif hasattr(portfolio_analysis, 'holdings'):
        all_holdings = portfolio_analysis.holdings

    if all_holdings:
        content += """
        <h5>Top Holdings</h5>
        <div class="table-responsive">
            <table class="table table-striped">
                <thead>
                    <tr>
                        <th>Symbol</th>
                        <th>Quantity</th>
                        <th>Avg Cost</th>
                        <th>Current Value</th>
                        <th>Unrealized P&L</th>
                        <th>Return %</th>
                    </tr>
                </thead>
                <tbody>
        """
        # Sort holdings by value and show top 10
        sorted_holdings = sorted(
            all_holdings,
            key=lambda h: getattr(h, 'current_value_gbp', 0),
            reverse=True
        )[:10]

        for holding in sorted_holdings:
            total_cost = getattr(holding, 'total_cost_gbp', 0)
            return_pct = (getattr(holding, 'unrealized_gain_loss', 0) / total_cost * 100) if total_cost > 0 else 0
            content += f"""
                    <tr>
                        <td>{getattr(holding.security, 'symbol', 'N/A') if hasattr(holding, 'security') else 'N/A'}</td>
                        <td>{getattr(holding, 'quantity', 0):,.0f}</td>
                        <td>£{getattr(holding, 'average_cost_gbp', 0):,.2f}</td>
                        <td>£{getattr(holding, 'current_value_gbp', 0):,.2f}</td>
                        <td class="{'text-success' if getattr(holding, 'unrealized_gain_loss', 0) > 0 else 'text-danger'}">£{getattr(holding, 'unrealized_gain_loss', 0):,.2f}</td>
                        <td class="{'text-success' if return_pct > 0 else 'text-danger'}">{return_pct:+.2f}%</td>
                    </tr>
            """
        content += """
                </tbody>
            </table>
        </div>
        """

    return content
