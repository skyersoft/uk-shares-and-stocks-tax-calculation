"""Terms of service page template."""

def get_terms_page_html() -> str:
    """Generate the terms of service page HTML."""
    
    return """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Terms of Service - IBKR Tax Calculator</title>
    <meta name="description" content="Terms of service for IBKR Tax Calculator. Important legal information about using our tax calculation service.">
    
    <!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body>
    <!-- Navigation -->
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
        <div class="container">
            <a class="navbar-brand" href="/">IBKR Tax Calculator</a>
            <div class="navbar-nav ms-auto">
                <a class="nav-link" href="/">Home</a>
                <a class="nav-link" href="/about">About</a>
                <a class="nav-link" href="/privacy">Privacy</a>
                <a class="nav-link active" href="/terms">Terms</a>
            </div>
        </div>
    </nav>

    <!-- Content -->
    <div class="container py-5">
        <div class="row">
            <div class="col-lg-8 mx-auto">
                <h1>Terms of Service</h1>
                <p class="text-muted">Last updated: January 2024</p>
                
                <h2>1. Acceptance of Terms</h2>
                <p>By accessing and using the IBKR Tax Calculator service, you accept and agree to be bound by the terms and provision of this agreement.</p>
                
                <h2>2. Description of Service</h2>
                <p>IBKR Tax Calculator is a web-based tool that provides:</p>
                <ul>
                    <li>UK tax calculations for Interactive Brokers transactions</li>
                    <li>Portfolio analysis and performance metrics</li>
                    <li>Tax reporting and documentation</li>
                    <li>Educational content about UK tax regulations</li>
                </ul>
                
                <h2>3. Disclaimer of Warranties</h2>
                <div class="alert alert-warning">
                    <h5>Important Tax Disclaimer</h5>
                    <p>This service provides estimates and calculations based on current UK tax rules. The results are for informational purposes only and should not be considered as professional tax advice. You should always:</p>
                    <ul class="mb-0">
                        <li>Consult with a qualified tax professional</li>
                        <li>Verify all calculations independently</li>
                        <li>Review current HMRC guidance</li>
                        <li>Consider your individual circumstances</li>
                    </ul>
                </div>
                
                <h2>4. Limitation of Liability</h2>
                <p>In no event shall IBKR Tax Calculator be liable for any direct, indirect, incidental, special, consequential, or punitive damages, including but not limited to:</p>
                <ul>
                    <li>Tax penalties or interest charges</li>
                    <li>Incorrect tax calculations or filings</li>
                    <li>Loss of data or information</li>
                    <li>Business interruption or lost profits</li>
                </ul>
                
                <h2>5. User Responsibilities</h2>
                <p>You are responsible for:</p>
                <ul>
                    <li>Providing accurate and complete transaction data</li>
                    <li>Verifying all calculations and results</li>
                    <li>Complying with all applicable tax laws</li>
                    <li>Seeking professional advice when needed</li>
                    <li>Protecting your account credentials</li>
                </ul>
                
                <h2>6. Data Usage</h2>
                <p>By using our service, you agree that:</p>
                <ul>
                    <li>You own or have rights to the data you upload</li>
                    <li>The data does not violate any third-party rights</li>
                    <li>We may process your data to provide the service</li>
                    <li>We do not permanently store your transaction data</li>
                </ul>
                
                <h2>7. Intellectual Property</h2>
                <p>The service and its original content, features, and functionality are owned by IBKR Tax Calculator and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.</p>
                
                <h2>8. Prohibited Uses</h2>
                <p>You may not use our service:</p>
                <ul>
                    <li>For any unlawful purpose or to solicit unlawful activity</li>
                    <li>To violate any international, federal, provincial, or state regulations or laws</li>
                    <li>To transmit or procure the sending of any advertising or promotional material</li>
                    <li>To impersonate or attempt to impersonate the company or other users</li>
                </ul>
                
                <h2>9. Service Availability</h2>
                <p>We strive to provide continuous service availability but do not guarantee:</p>
                <ul>
                    <li>Uninterrupted access to the service</li>
                    <li>Error-free operation</li>
                    <li>Compatibility with all devices or browsers</li>
                    <li>Permanent availability of the service</li>
                </ul>
                
                <h2>10. Modifications to Terms</h2>
                <p>We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting. Your continued use of the service constitutes acceptance of the modified terms.</p>
                
                <h2>11. Termination</h2>
                <p>We may terminate or suspend your access to the service immediately, without prior notice, for any reason, including breach of these terms.</p>
                
                <h2>12. Governing Law</h2>
                <p>These terms shall be governed by and construed in accordance with the laws of the United Kingdom, without regard to its conflict of law provisions.</p>
                
                <h2>13. Contact Information</h2>
                <p>If you have any questions about these Terms of Service, please contact us through our website.</p>
                
                <div class="alert alert-danger mt-4">
                    <h5>Professional Advice Required</h5>
                    <p class="mb-0">This tool is not a substitute for professional tax advice. Always consult with a qualified tax advisor or accountant before making tax-related decisions or filing your tax return.</p>
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
