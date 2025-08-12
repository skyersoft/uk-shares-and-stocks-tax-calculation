"""Privacy policy page template."""

def get_privacy_page_html() -> str:
    """Generate the privacy policy page HTML."""
    
    return """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Privacy Policy - IBKR Tax Calculator</title>
    <meta name="description" content="Privacy policy for IBKR Tax Calculator. Learn how we protect your financial data and transaction information.">
    
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
                <a class="nav-link active" href="/privacy">Privacy</a>
                <a class="nav-link" href="/terms">Terms</a>
            </div>
        </div>
    </nav>

    <!-- Content -->
    <div class="container py-5">
        <div class="row">
            <div class="col-lg-8 mx-auto">
                <h1>Privacy Policy</h1>
                <p class="text-muted">Last updated: January 2024</p>
                
                <h2>1. Information We Collect</h2>
                <p>We collect information you provide directly to us, such as:</p>
                <ul>
                    <li>Transaction data from uploaded CSV files</li>
                    <li>Tax year selections and calculation preferences</li>
                    <li>Usage analytics to improve our service</li>
                </ul>
                
                <h2>2. How We Use Your Information</h2>
                <p>We use the information we collect to:</p>
                <ul>
                    <li>Perform tax calculations and generate reports</li>
                    <li>Improve our calculation algorithms</li>
                    <li>Provide customer support</li>
                    <li>Comply with legal obligations</li>
                </ul>
                
                <h2>3. Data Security</h2>
                <p>We implement appropriate security measures to protect your personal information:</p>
                <ul>
                    <li>All data is processed in secure AWS Lambda functions</li>
                    <li>Temporary files are automatically deleted after processing</li>
                    <li>No transaction data is permanently stored</li>
                    <li>All communications are encrypted using HTTPS</li>
                </ul>
                
                <h2>4. Data Retention</h2>
                <p>We do not permanently store your transaction data. All uploaded files and calculation results are processed in memory and automatically deleted after your session ends.</p>
                
                <h2>5. Third-Party Services</h2>
                <p>We use the following third-party services:</p>
                <ul>
                    <li><strong>AWS Lambda:</strong> For secure computation processing</li>
                    <li><strong>Google AdSense:</strong> For displaying relevant advertisements</li>
                    <li><strong>Amazon Associates:</strong> For affiliate product recommendations</li>
                </ul>
                
                <h2>6. Cookies and Analytics</h2>
                <p>We use cookies and similar technologies to:</p>
                <ul>
                    <li>Remember your preferences</li>
                    <li>Analyze website usage patterns</li>
                    <li>Display relevant advertisements</li>
                </ul>
                
                <h2>7. Your Rights</h2>
                <p>You have the right to:</p>
                <ul>
                    <li>Access your personal information</li>
                    <li>Correct inaccurate information</li>
                    <li>Request deletion of your information</li>
                    <li>Opt-out of marketing communications</li>
                </ul>
                
                <h2>8. Children's Privacy</h2>
                <p>Our service is not intended for children under 18. We do not knowingly collect personal information from children under 18.</p>
                
                <h2>9. Changes to This Policy</h2>
                <p>We may update this privacy policy from time to time. We will notify you of any changes by posting the new privacy policy on this page.</p>
                
                <h2>10. Contact Us</h2>
                <p>If you have any questions about this privacy policy, please contact us through our website.</p>
                
                <div class="alert alert-info mt-4">
                    <h5>Data Protection</h5>
                    <p class="mb-0">Your financial data is never permanently stored. All calculations are performed in secure, temporary environments and data is automatically deleted after processing.</p>
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
