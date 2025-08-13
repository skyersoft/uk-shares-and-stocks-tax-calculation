"""CGT guide page template explaining UK Capital Gains Tax calculations."""


def get_cgt_guide_page_html() -> str:
    """Generate the CGT guide page HTML."""
    
    return """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>UK Capital Gains Tax Guide - IBKR Tax Calculator</title>
    <meta name="description" content="Complete guide to UK Capital Gains Tax calculations, allowances, and rules for share trading.">
    
    <!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
    
    <!-- Custom CSS -->
    <style>
        .calculation-box {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            padding: 1.5rem;
            margin: 1rem 0;
        }
        .formula {
            background: #e3f2fd;
            border-left: 4px solid #2196f3;
            padding: 1rem;
            margin: 1rem 0;
            font-family: monospace;
        }
        .example-box {
            background: #f1f8e9;
            border: 1px solid #c8e6c9;
            border-radius: 8px;
            padding: 1.5rem;
            margin: 1rem 0;
        }
        .warning-box {
            background: #fff3e0;
            border: 1px solid #ffcc02;
            border-radius: 8px;
            padding: 1rem;
            margin: 1rem 0;
        }
        .rate-table {
            background: white;
            border: 1px solid #dee2e6;
        }
    </style>
</head>
<body>
    <!-- Navigation -->
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
        <div class="container">
            <a class="navbar-brand" href="/">IBKR Tax Calculator</a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav ms-auto">
                    <li class="nav-item">
                        <a class="nav-link" href="/">Home</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="/about">About</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="/help">Help</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link active" href="/cgt-guide">CGT Guide</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="/privacy">Privacy</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="/terms">Terms</a>
                    </li>
                </ul>
            </div>
        </div>
    </nav>

    <!-- Header -->
    <div class="bg-primary text-white py-5">
        <div class="container">
            <h1 class="display-4">UK Capital Gains Tax Guide</h1>
            <p class="lead">Understanding how Capital Gains Tax is calculated for share trading</p>
        </div>
    </div>

    <!-- Main Content -->
    <div class="container py-5">
        
        <!-- Overview -->
        <section class="mb-5">
            <h2>What is Capital Gains Tax?</h2>
            <p class="lead">Capital Gains Tax (CGT) is a tax on the profit when you sell (or 'dispose of') something that's increased in value. For shares, you pay CGT on the gain you make when you sell shares for more than you paid for them.</p>
            
            <div class="warning-box">
                <h5><i class="fas fa-exclamation-triangle text-warning"></i> Important Limitations</h5>
                <p class="mb-0"><strong>This calculator handles shares and ETFs only.</strong> It does not calculate CGT for:</p>
                <ul class="mb-0">
                    <li>Options trading</li>
                    <li>Futures contracts</li>
                    <li>CFDs (Contracts for Difference)</li>
                    <li>Forex trading</li>
                    <li>Cryptocurrency</li>
                    <li>Property transactions</li>
                </ul>
            </div>
        </section>

        <!-- Annual Allowance -->
        <section class="mb-5">
            <h2>Annual CGT Allowance</h2>
            <p>Each tax year, you get a tax-free allowance for capital gains:</p>
            
            <div class="row">
                <div class="col-md-6">
                    <div class="calculation-box">
                        <h4>2024-25 Tax Year</h4>
                        <p class="h3 text-primary">£3,000</p>
                        <small class="text-muted">Annual CGT allowance</small>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="calculation-box">
                        <h4>2023-24 Tax Year</h4>
                        <p class="h3 text-primary">£6,000</p>
                        <small class="text-muted">Annual CGT allowance</small>
                    </div>
                </div>
            </div>
            
            <p>You only pay CGT if your total gains for the tax year exceed this allowance.</p>
        </section>

        <!-- CGT Rate Changes Warning for 2024-25 -->
        <section class="mb-5">
            <div class="alert alert-warning border-warning">
                <div class="d-flex align-items-start">
                    <i class="fas fa-exclamation-triangle fa-2x text-warning me-3 mt-1"></i>
                    <div>
                        <h4 class="alert-heading mb-3">
                            <strong>⚠️ CRITICAL: CGT Rate Changes in 2024-25</strong>
                        </h4>
                        <p class="mb-3">
                            <strong>Capital Gains Tax rates for shares and ETFs changed significantly during the 2024-25 tax year.</strong>
                            This affects how you should calculate your tax liability:
                        </p>

                        <div class="row">
                            <div class="col-md-6">
                                <div class="card bg-light border-0 mb-3">
                                    <div class="card-body p-3">
                                        <h6 class="card-title text-primary mb-2">
                                            <i class="fas fa-calendar"></i> 6 April - 29 October 2024
                                        </h6>
                                        <ul class="mb-0">
                                            <li><strong>Shares/ETFs (Basic Rate):</strong> 10%</li>
                                            <li><strong>Shares/ETFs (Higher Rate):</strong> 20%</li>
                                            <li><strong>Residential Property:</strong> 18% / 24%</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="card bg-light border-0 mb-3">
                                    <div class="card-body p-3">
                                        <h6 class="card-title text-danger mb-2">
                                            <i class="fas fa-calendar"></i> 30 October 2024 - 5 April 2025
                                        </h6>
                                        <ul class="mb-0">
                                            <li><strong>Shares/ETFs (Basic Rate):</strong> 18% <span class="badge bg-danger">+8%</span></li>
                                            <li><strong>Shares/ETFs (Higher Rate):</strong> 24% <span class="badge bg-danger">+4%</span></li>
                                            <li><strong>Residential Property:</strong> 18% / 24% (unchanged)</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="alert alert-info mb-3">
                            <h6 class="mb-2"><i class="fas fa-lightbulb"></i> Important for IBKR Users:</h6>
                            <p class="mb-2">When exporting your IBKR data, consider splitting by disposal dates:</p>
                            <ol class="mb-0">
                                <li><strong>Period 1:</strong> 6 April 2024 to 29 October 2024 (lower rates)</li>
                                <li><strong>Period 2:</strong> 30 October 2024 to 5 April 2025 (higher rates)</li>
                            </ol>
                        </div>

                        <p class="mb-0">
                            <strong>Source:</strong>
                            <a href="https://www.gov.uk/guidance/capital-gains-tax-rates-and-allowances#rates-for-capital-gains-tax"
                               target="_blank" class="text-decoration-none">
                                HMRC Official Guidance <i class="fas fa-external-link-alt"></i>
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </section>

        <!-- CGT Rates -->
        <section class="mb-5">
            <h2>CGT Tax Rates</h2>
            <p>The rate you pay depends on your total income and the type of asset:</p>
            
            <div class="table-responsive">
                <table class="table rate-table">
                    <thead class="table-dark">
                        <tr>
                            <th>Income Band</th>
                            <th>Shares & ETFs</th>
                            <th>Residential Property</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Basic rate taxpayer</td>
                            <td class="text-success"><strong>10%</strong></td>
                            <td>18%</td>
                        </tr>
                        <tr>
                            <td>Higher/Additional rate taxpayer</td>
                            <td class="text-warning"><strong>20%</strong></td>
                            <td>28%</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <div class="alert alert-info">
                <strong>Note:</strong> This calculator focuses on shares and ETFs, which use the 10%/20% rates.
            </div>
        </section>

        <!-- Calculation Method -->
        <section class="mb-5">
            <h2>How CGT is Calculated</h2>
            
            <h3>Basic Formula</h3>
            <div class="formula">
                Capital Gain = Sale Proceeds - Purchase Cost - Allowable Costs
            </div>
            
            <h4>Components Explained:</h4>
            <ul>
                <li><strong>Sale Proceeds:</strong> Amount received from selling shares</li>
                <li><strong>Purchase Cost:</strong> Amount paid to buy the shares (including commission)</li>
                <li><strong>Allowable Costs:</strong> Trading fees, commission, stamp duty</li>
            </ul>

            <h3>Section 104 Holding (Pooling)</h3>
            <p>For shares of the same company, the UK uses "Section 104 holding" rules:</p>
            
            <div class="calculation-box">
                <h5>How Pooling Works:</h5>
                <ol>
                    <li>All shares of the same company are pooled together</li>
                    <li>Average cost is calculated across all purchases</li>
                    <li>When you sell, you use the average cost per share</li>
                    <li>FIFO (First In, First Out) is NOT used for UK CGT</li>
                </ol>
            </div>

            <div class="example-box">
                <h5><i class="fas fa-calculator"></i> Example: Section 104 Calculation</h5>
                <p><strong>Scenario:</strong> You buy Apple shares in multiple transactions:</p>
                <ul>
                    <li>Jan: Buy 100 shares at £150 each = £15,000</li>
                    <li>Mar: Buy 50 shares at £160 each = £8,000</li>
                    <li>Jun: Sell 75 shares at £170 each = £12,750</li>
                </ul>
                
                <p><strong>Calculation:</strong></p>
                <div class="formula">
                    Total shares: 150 shares<br>
                    Total cost: £23,000<br>
                    Average cost per share: £23,000 ÷ 150 = £153.33<br>
                    <br>
                    Sale of 75 shares:<br>
                    Proceeds: £12,750<br>
                    Cost basis: 75 × £153.33 = £11,500<br>
                    Capital Gain: £12,750 - £11,500 = £1,250
                </div>
            </div>
        </section>

        <!-- Allowable Costs -->
        <section class="mb-5">
            <h2>Allowable Costs</h2>
            <p>You can deduct certain costs from your capital gains:</p>
            
            <div class="row">
                <div class="col-md-6">
                    <h4 class="text-success">✅ Allowable</h4>
                    <ul>
                        <li>Broker commission and fees</li>
                        <li>Stamp duty (0.5% on UK shares)</li>
                        <li>Currency conversion costs</li>
                        <li>Transfer fees</li>
                        <li>Professional advice costs</li>
                    </ul>
                </div>
                <div class="col-md-6">
                    <h4 class="text-danger">❌ Not Allowable</h4>
                    <ul>
                        <li>Interest on loans to buy shares</li>
                        <li>Subscription fees for research</li>
                        <li>General investment advice</li>
                        <li>Costs of managing investments</li>
                    </ul>
                </div>
            </div>
        </section>

        <!-- Losses -->
        <section class="mb-5">
            <h2>Capital Losses</h2>
            <p>Capital losses can be used to reduce your CGT liability:</p>
            
            <div class="calculation-box">
                <h4>Loss Relief Rules:</h4>
                <ol>
                    <li><strong>Same Year:</strong> Losses automatically offset gains in the same tax year</li>
                    <li><strong>Carry Forward:</strong> Unused losses can be carried forward indefinitely</li>
                    <li><strong>Annual Allowance:</strong> Use losses only after using your annual allowance</li>
                    <li><strong>No Carry Back:</strong> Losses cannot be carried back to previous years</li>
                </ol>
            </div>

            <div class="example-box">
                <h5><i class="fas fa-chart-line"></i> Example: Using Losses</h5>
                <p><strong>2024-25 Tax Year:</strong></p>
                <ul>
                    <li>Capital gains: £8,000</li>
                    <li>Capital losses: £2,000</li>
                    <li>Net gains: £6,000</li>
                    <li>Annual allowance: £3,000</li>
                    <li><strong>Taxable gains: £3,000</strong></li>
                </ul>
            </div>
        </section>

        <!-- Currency Considerations -->
        <section class="mb-5">
            <h2>Currency Considerations</h2>
            <p>For international shares (like US stocks), special rules apply:</p>
            
            <div class="calculation-box">
                <h4>Currency Conversion Rules:</h4>
                <ul>
                    <li>Convert foreign currency amounts to GBP using exchange rates on transaction dates</li>
                    <li>Use HMRC's published rates or actual rates paid</li>
                    <li>Currency gains/losses on the shares themselves may be subject to CGT</li>
                    <li>Small currency gains (under £500 per disposal) are exempt</li>
                </ul>
            </div>
        </section>

        <!-- Reporting Requirements -->
        <section class="mb-5">
            <h2>When to Report CGT</h2>
            
            <div class="alert alert-warning">
                <h5><i class="fas fa-exclamation-circle"></i> Reporting Thresholds</h5>
                <p>You must report capital gains if:</p>
                <ul class="mb-0">
                    <li>Your total gains exceed the annual allowance (£3,000 for 2024-25)</li>
                    <li>Your total proceeds from all disposals exceed 4 times the annual allowance (£12,000 for 2024-25)</li>
                </ul>
            </div>

            <h4>Deadlines:</h4>
            <ul>
                <li><strong>Self Assessment:</strong> 31 January following the end of the tax year</li>
                <li><strong>Capital Gains Tax on UK property:</strong> 60 days from completion</li>
            </ul>
        </section>

        <!-- Calculator Features -->
        <section class="mb-5">
            <h2>How Our Calculator Helps</h2>
            
            <div class="row">
                <div class="col-md-4">
                    <div class="calculation-box text-center">
                        <i class="fas fa-calculator fa-3x text-primary mb-3"></i>
                        <h5>Automatic Calculations</h5>
                        <p>Handles Section 104 pooling and average cost calculations automatically</p>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="calculation-box text-center">
                        <i class="fas fa-exchange-alt fa-3x text-success mb-3"></i>
                        <h5>Currency Conversion</h5>
                        <p>Converts foreign currency transactions to GBP using historical rates</p>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="calculation-box text-center">
                        <i class="fas fa-file-alt fa-3x text-info mb-3"></i>
                        <h5>Detailed Reports</h5>
                        <p>Generates comprehensive reports for HMRC compliance</p>
                    </div>
                </div>
            </div>
        </section>

        <!-- Disclaimer -->
        <section class="mb-5">
            <div class="alert alert-danger">
                <h5><i class="fas fa-exclamation-triangle"></i> Important Disclaimer</h5>
                <p class="mb-0">This calculator is for guidance only and should not be considered as professional tax advice. Tax rules can be complex and may change. Always consult with a qualified tax advisor or accountant for your specific situation. HMRC is the authoritative source for UK tax rules.</p>
            </div>
        </section>

        <!-- Call to Action -->
        <section class="text-center">
            <h2 class="mb-4">Ready to Calculate Your CGT?</h2>
            <div class="d-flex gap-3 justify-content-center">
                <a href="/" class="btn btn-primary btn-lg">
                    <i class="fas fa-calculator"></i> Start Calculation
                </a>
                <a href="/help" class="btn btn-outline-primary btn-lg">
                    <i class="fas fa-question-circle"></i> Export Guide
                </a>
            </div>
        </section>
    </div>

    <!-- Footer -->
    <footer class="bg-dark text-white py-4">
        <div class="container">
            <div class="row">
                <div class="col-md-6">
                    <p>&copy; 2024 IBKR Tax Calculator. All rights reserved.</p>
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
