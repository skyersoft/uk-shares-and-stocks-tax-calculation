import React from 'react';

export interface PrivacyProps {
  className?: string;
}

export const Privacy: React.FC<PrivacyProps> = ({ className = '' }) => {
  return (
    <div className={`privacy-page ${className}`}>
      {/* Hero Section */}
      <section className="hero-section bg-primary text-white py-5">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-8">
              <h1 className="display-4 fw-bold mb-4">Privacy Policy</h1>
              <p className="lead mb-4">
                Your privacy is our priority. Learn how we protect your financial data and personal information.
              </p>
            </div>
            <div className="col-lg-4 text-center">
              <i className="bi bi-shield-check" style={{ fontSize: '6rem', opacity: 0.8 }}></i>
            </div>
          </div>
        </div>
      </section>

      <div className="container py-5">
        <div className="row">
          <div className="col-lg-8 mx-auto">

            {/* Introduction */}
            <section className="mb-5">
              <p className="lead">
                The IBKR Tax Calculator is designed with privacy as a fundamental principle.
                This policy explains our commitment to protecting your personal and financial information.
              </p>
            </section>

            {/* Data Collection */}
            <section className="mb-5">
              <h2 className="mb-4">Data Collection</h2>
              <div className="card border-success">
                <div className="card-body">
                  <div className="d-flex align-items-start">
                    <i className="bi bi-check-circle-fill text-success me-3 mt-1" style={{ fontSize: '1.5rem' }}></i>
                    <div>
                      <h5 className="text-success">No Data Collection</h5>
                      <p className="mb-0">
                        We do not collect, store, or transmit any of your personal or financial data.
                        Your transaction files, calculations, and results remain entirely on your device.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Local Processing */}
            <section className="mb-5">
              <h2 className="mb-4">Local Processing</h2>
              <p>
                All calculations are performed locally in your web browser. When you upload your
                transaction files or enter data manually:
              </p>
              <ul className="list-group list-group-flush">
                <li className="list-group-item d-flex align-items-center">
                  <i className="bi bi-laptop text-primary me-3"></i>
                  Files are processed entirely within your browser
                </li>
                <li className="list-group-item d-flex align-items-center">
                  <i className="bi bi-shield-lock text-primary me-3"></i>
                  No data is uploaded to our servers
                </li>
                <li className="list-group-item d-flex align-items-center">
                  <i className="bi bi-trash text-primary me-3"></i>
                  Data is cleared when you close the browser or refresh the page
                </li>
              </ul>
            </section>

            {/* Security Measures */}
            <section className="mb-5">
              <h2 className="mb-4">Security Measures</h2>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <div className="card h-100">
                    <div className="card-body">
                      <h5 className="card-title">
                        <i className="bi bi-lock-fill text-primary me-2"></i>
                        Client-Side Encryption
                      </h5>
                      <p className="card-text">
                        All data processing uses modern browser security features and remains encrypted
                        within your device's memory.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-md-6 mb-3">
                  <div className="card h-100">
                    <div className="card-body">
                      <h5 className="card-title">
                        <i className="bi bi-globe text-primary me-2"></i>
                        HTTPS Security
                      </h5>
                      <p className="card-text">
                        Our website uses HTTPS encryption to ensure secure communication between
                        your browser and our servers.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Cookies and Tracking */}
            <section className="mb-5">
              <h2 className="mb-4">Cookies and Tracking</h2>
              <div className="alert alert-warning">
                <div className="d-flex align-items-center">
                  <i className="bi bi-info-circle-fill me-3" style={{ fontSize: '1.5rem' }}></i>
                  <div>
                    <h6 className="alert-heading mb-2">Google Analytics</h6>
                    <p className="mb-0">
                      We use Google Analytics to understand how visitors use our website and improve the user experience.
                      This service uses cookies to collect anonymous usage data.
                    </p>
                  </div>
                </div>
              </div>
              <h5 className="mt-4 mb-3">What Data is Collected?</h5>
              <ul>
                <li><strong>Usage Metrics:</strong> Page views, button clicks, time spent on pages</li>
                <li><strong>Technical Information:</strong> Browser type, device type, screen resolution</li>
                <li><strong>Anonymous Analytics:</strong> Number of files uploaded, calculation success/error rates</li>
                <li><strong>NOT Collected:</strong> Your transaction data, file contents, or any personally identifiable information</li>
              </ul>
              <h5 className="mt-4 mb-3">Your Choices</h5>
              <p>
                You can opt out of Google Analytics by:
              </p>
              <ul>
                <li>Using browser privacy settings to block analytics cookies</li>
                <li>Installing the <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer">Google Analytics Opt-out Browser Add-on</a></li>
                <li>Using private/incognito browsing mode</li>
              </ul>
            </section>

            {/* Third-Party Services */}
            <section className="mb-5">
              <h2 className="mb-4">Third-Party Services</h2>
              <p>
                We use the following third-party services to improve our website:
              </p>
              <div className="card mb-3">
                <div className="card-body">
                  <h5 className="card-title">
                    <i className="bi bi-bar-chart text-primary me-2"></i>
                    Google Analytics
                  </h5>
                  <p className="card-text">
                    We use Google Analytics to collect anonymous usage statistics. This helps us understand
                    how visitors use the calculator and identify areas for improvement.
                  </p>
                  <p className="card-text mb-0">
                    <strong>Data Shared:</strong> Anonymous usage metrics only (page views, clicks, timing)
                    <br />
                    <strong>NOT Shared:</strong> Your transaction files, calculation results, or any personal data
                    <br />
                    <strong>Privacy Policy:</strong> <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google Privacy Policy</a>
                  </p>
                </div>
              </div>
              <div className="card mb-3">
                <div className="card-body">
                  <h5 className="card-title">
                    <i className="bi bi-badge-ad text-success me-2"></i>
                    Google AdSense
                  </h5>
                  <p className="card-text mb-0">
                    We display ads through Google AdSense to support this free service. AdSense may use cookies
                    for ad personalization. You can manage ad preferences in your Google account settings.
                  </p>
                </div>
              </div>
              <div className="alert alert-success mt-3">
                <strong>Important:</strong> While we use these services for analytics and advertising,
                your financial data and transaction files are NEVER shared with any third party.
                All calculations remain local to your browser.
              </div>
            </section>

            {/* Data Retention */}
            <section className="mb-5">
              <h2 className="mb-4">Data Retention</h2>
              <div className="card bg-light">
                <div className="card-body">
                  <h5 className="card-title">Zero Data Retention</h5>
                  <p className="card-text">
                    No data is retained on our servers because no data is sent to our servers.
                    Your information exists only temporarily in your browser's memory during use.
                  </p>
                  <ul className="mb-0">
                    <li>Files are not saved to our systems</li>
                    <li>Calculations are not stored remotely</li>
                    <li>User preferences are saved locally (if any)</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Your Rights */}
            <section className="mb-5">
              <h2 className="mb-4">Your Rights</h2>
              <p>
                You have full control over your data because it never leaves your device:
              </p>
              <div className="row">
                <div className="col-md-4 mb-3">
                  <div className="text-center">
                    <i className="bi bi-person-check text-success mb-2" style={{ fontSize: '2.5rem' }}></i>
                    <h6>Complete Control</h6>
                    <small className="text-muted">Your data stays with you</small>
                  </div>
                </div>
                <div className="col-md-4 mb-3">
                  <div className="text-center">
                    <i className="bi bi-eye-slash text-success mb-2" style={{ fontSize: '2.5rem' }}></i>
                    <h6>No Monitoring</h6>
                    <small className="text-muted">We cannot see your data</small>
                  </div>
                </div>
                <div className="col-md-4 mb-3">
                  <div className="text-center">
                    <i className="bi bi-trash text-success mb-2" style={{ fontSize: '2.5rem' }}></i>
                    <h6>Easy Deletion</h6>
                    <small className="text-muted">Close browser to clear</small>
                  </div>
                </div>
              </div>
            </section>

            {/* Contact Us */}
            <section className="mb-5">
              <h2 className="mb-4">Contact Us</h2>
              <div className="card">
                <div className="card-body">
                  <p>
                    If you have questions about this privacy policy or our data practices,
                    please contact us:
                  </p>
                  <div className="row">
                    <div className="col-md-6">
                      <p>
                        <strong>Email:</strong><br />
                        <a href="mailto:privacy@ibkr-tax-calculator.com">
                          privacy@ibkr-tax-calculator.com
                        </a>
                      </p>
                    </div>
                    <div className="col-md-6">
                      <p>
                        <strong>General Support:</strong><br />
                        <a href="mailto:support@ibkr-tax-calculator.com">
                          support@ibkr-tax-calculator.com
                        </a>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Policy Updates */}
            <section className="mb-5">
              <h2 className="mb-4">Policy Updates</h2>
              <p>
                We may update this privacy policy from time to time to reflect changes in our practices
                or for other operational, legal, or regulatory reasons. Any changes will be posted on this page
                with an updated effective date.
              </p>
              <div className="alert alert-secondary">
                <small>
                  Since we don't collect contact information, we cannot notify users directly of policy changes.
                  Please review this policy periodically for updates.
                </small>
              </div>
            </section>

            {/* Footer */}
            <section className="text-center py-4 border-top">
              <div className="row">
                <div className="col-md-6">
                  <small className="text-muted">
                    <strong>Effective Date:</strong> November 2024
                  </small>
                </div>
                <div className="col-md-6">
                  <small className="text-muted">
                    <strong>Version:</strong> 1.1
                  </small>
                </div>
              </div>
              <div className="mt-3">
                <a href="/terms" className="btn btn-outline-primary btn-sm me-2">
                  <i className="bi bi-file-text me-1"></i>
                  Terms of Service
                </a>
                <a href="/help" className="btn btn-outline-primary btn-sm">
                  <i className="bi bi-question-circle me-1"></i>
                  Help & Support
                </a>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Privacy;