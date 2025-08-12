"""About page template."""

def get_about_page_html() -> str:
    """Generate the about page HTML."""
    
    return """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>About - IBKR Tax Calculator</title>
    <meta name="description" content="Learn about our UK tax calculator for Interactive Brokers. HMRC compliant calculations for capital gains, dividends, and portfolio analysis.">
    
    <!-- Google AdSense -->
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-YOUR_ADSENSE_ID"
            crossorigin="anonymous"></script>
    
    <!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
    
    <style>
        .hero-section {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 60px 0;
        }
        .ad-container {
            margin: 20px 0;
            text-align: center;
        }
    </style>
</head>
<body>
    <!-- Navigation -->
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
        <div class="container">
            <a class="navbar-brand" href="/">IBKR Tax Calculator</a>
            <div class="navbar-nav ms-auto">
                <a class="nav-link" href="/">Home</a>
                <a class="nav-link active" href="/about">About</a>
                <a class="nav-link" href="/privacy">Privacy</a>
                <a class="nav-link" href="/terms">Terms</a>
            </div>
        </div>
    </nav>

    <!-- Hero Section -->
    <section class="hero-section">
        <div class="container text-center">
            <h1 class="display-4 fw-bold mb-4">About IBKR Tax Calculator</h1>
            <p class="lead">Professional UK tax calculations for Interactive Brokers users</p>
        </div>
    </section>

    <!-- Content -->
    <div class="container py-5">
        <div class="row">
            <div class="col-lg-8">
                <h2>What We Do</h2>
                <p class="lead">We provide accurate UK tax calculations specifically designed for Interactive Brokers users, ensuring HMRC compliance and comprehensive portfolio analysis.</p>
                
                <h3>Key Features</h3>
                <ul>
                    <li><strong>HMRC Compliant Calculations:</strong> Our algorithms follow UK tax regulations for capital gains, dividend income, and currency gains.</li>
                    <li><strong>Section 104 Pool Calculations:</strong> Accurate cost basis calculations using UK tax rules.</li>
                    <li><strong>Portfolio Analytics:</strong> Comprehensive analysis of your current holdings and performance.</li>
                    <li><strong>Multiple Report Formats:</strong> Generate reports in HTML, CSV, and JSON formats.</li>
                    <li><strong>Tax Year Support:</strong> Calculate taxes for multiple UK tax years.</li>
                </ul>
                
                <h3>How It Works</h3>
                <ol>
                    <li><strong>Upload Your Data:</strong> Upload your Interactive Brokers transaction CSV file.</li>
                    <li><strong>Automatic Processing:</strong> Our system processes all transactions using UK tax rules.</li>
                    <li><strong>Comprehensive Analysis:</strong> Get detailed tax calculations and portfolio analytics.</li>
                    <li><strong>Professional Reports:</strong> Download or print professional reports for tax filing.</li>
                </ol>
                
                <h3>Supported Transaction Types</h3>
                <ul>
                    <li>Stock purchases and sales</li>
                    <li>Dividend payments</li>
                    <li>Currency exchanges</li>
                    <li>Commissions and fees</li>
                    <li>Corporate actions</li>
                </ul>
                
                <h3>Tax Calculations</h3>
                <p>Our calculator handles:</p>
                <ul>
                    <li><strong>Capital Gains Tax:</strong> Using Section 104 pool rules and annual exemptions</li>
                    <li><strong>Dividend Tax:</strong> Including dividend allowances and withholding tax credits</li>
                    <li><strong>Currency Gains:</strong> Foreign exchange gains and losses with de minimis rules</li>
                </ul>
                
                <div class="alert alert-warning mt-4">
                    <h5>Important Disclaimer</h5>
                    <p class="mb-0">This tool provides estimates based on current UK tax rules. Always consult with a qualified tax professional for personalized advice and before filing your tax return.</p>
                </div>
            </div>
            
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
                         (adsbygoogle = window.adsbygoogle || []).push({});
                    </script>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <h5>Quick Start</h5>
                    </div>
                    <div class="card-body">
                        <p>Ready to calculate your taxes?</p>
                        <a href="/" class="btn btn-primary">Start Calculation</a>
                    </div>
                </div>
                
                <div class="card mt-3">
                    <div class="card-header">
                        <h5>Need Help?</h5>
                    </div>
                    <div class="card-body">
                        <p>Check our FAQ or contact support for assistance with your tax calculations.</p>
                    </div>
                </div>
            </div>
        </div>
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
</body>
</html>
    """
