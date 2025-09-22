import React from 'react';

export interface TermsProps {
  className?: string;
}

export const Terms: React.FC<TermsProps> = ({ className = '' }) => {
  return (
    <div className={`terms-page ${className}`}>
      {/* Hero Section */}
      <section className="hero-section bg-primary text-white py-5">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-8">
              <h1 className="display-4 fw-bold mb-4">Terms of Service</h1>
              <p className="lead mb-4">
                Please read these terms carefully before using the IBKR Tax Calculator service.
              </p>
            </div>
            <div className="col-lg-4 text-center">
              <i className="bi bi-file-text" style={{ fontSize: '6rem', opacity: 0.8 }}></i>
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
                These Terms of Service ("Terms") govern your use of the IBKR Tax Calculator 
                website and services. By using our service, you agree to be bound by these terms.
              </p>
            </section>

            {/* Acceptance of Terms */}
            <section className="mb-5">
              <h2 className="mb-4">Acceptance of Terms</h2>
              <p>
                By accessing and using the IBKR Tax Calculator service, you acknowledge that you have 
                read, understood, and agree to be bound by these Terms of Service and our Privacy Policy. 
                If you do not agree to these terms, please do not use our service.
              </p>
            </section>

            {/* Service Description */}
            <section className="mb-5">
              <h2 className="mb-4">Service Description</h2>
              <p>
                The IBKR Tax Calculator is a web-based UK capital gains tax calculator designed to help 
                individual investors calculate their tax obligations. Our service:
              </p>
              <ul className="list-group list-group-flush">
                <li className="list-group-item d-flex align-items-center">
                  <i className="bi bi-calculator text-primary me-3"></i>
                  Performs capital gains tax calculations using HMRC guidelines
                </li>
                <li className="list-group-item d-flex align-items-center">
                  <i className="bi bi-file-earmark-text text-primary me-3"></i>
                  Processes transaction data from various file formats
                </li>
                <li className="list-group-item d-flex align-items-center">
                  <i className="bi bi-shield-check text-primary me-3"></i>
                  Operates entirely client-side for privacy and security
                </li>
                <li className="list-group-item d-flex align-items-center">
                  <i className="bi bi-info-circle text-primary me-3"></i>
                  Provides educational resources and guidance
                </li>
              </ul>
            </section>

            {/* User Responsibilities */}
            <section className="mb-5">
              <h2 className="mb-4">User Responsibilities</h2>
              <div className="card">
                <div className="card-body">
                  <p>You are responsible for:</p>
                  <ul>
                    <li>Ensuring the accuracy and completeness of your transaction data</li>
                    <li>Verifying all calculations and results before using them for tax purposes</li>
                    <li>Consulting with qualified tax professionals for complex situations</li>
                    <li>Complying with all applicable tax laws and regulations</li>
                    <li>Using the service only for lawful purposes</li>
                    <li>Not attempting to reverse engineer or compromise the service</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Disclaimers */}
            <section className="mb-5">
              <h2 className="mb-4">Disclaimers</h2>
              <div className="alert alert-warning">
                <div className="d-flex align-items-center">
                  <i className="bi bi-exclamation-triangle-fill me-3" style={{ fontSize: '1.5rem' }}></i>
                  <div>
                    <h6 className="alert-heading mb-2">Important Notice</h6>
                    <p className="mb-0">
                      This service is provided for informational purposes only and does not constitute 
                      professional tax advice. Always consult with qualified tax professionals for 
                      your specific situation.
                    </p>
                  </div>
                </div>
              </div>
              <p>
                While we strive to ensure accuracy, we make no warranties or representations about:
              </p>
              <ul>
                <li>The accuracy, completeness, or reliability of calculations</li>
                <li>The suitability of the service for your specific circumstances</li>
                <li>Compliance with current or future tax regulations</li>
                <li>The availability or continuity of the service</li>
              </ul>
            </section>

            {/* Limitation of Liability */}
            <section className="mb-5">
              <h2 className="mb-4">Limitation of Liability</h2>
              <div className="card bg-light">
                <div className="card-body">
                  <p>
                    We shall not be liable for any direct, indirect, incidental, consequential, or 
                    punitive damages arising from:
                  </p>
                  <div className="row">
                    <div className="col-md-6">
                      <ul>
                        <li>Use or inability to use the service</li>
                        <li>Errors in calculations or results</li>
                        <li>Reliance on information provided</li>
                      </ul>
                    </div>
                    <div className="col-md-6">
                      <ul>
                        <li>Tax penalties or additional liabilities</li>
                        <li>Service interruptions or outages</li>
                        <li>Data loss or corruption</li>
                      </ul>
                    </div>
                  </div>
                  <p className="mb-0">
                    <strong>Maximum liability:</strong> Our total liability shall not exceed the amount 
                    you paid for using the service (which is currently zero as the service is free).
                  </p>
                </div>
              </div>
            </section>

            {/* Intellectual Property */}
            <section className="mb-5">
              <h2 className="mb-4">Intellectual Property</h2>
              <p>
                All content and software comprising the IBKR Tax Calculator service, including but not 
                limited to code, algorithms, design, text, and graphics, are owned by or licensed to us 
                and are protected by copyright and other intellectual property laws.
              </p>
              <div className="row">
                <div className="col-md-6">
                  <h5>Your Rights</h5>
                  <ul>
                    <li>Use the service for personal purposes</li>
                    <li>Generate reports for your tax filings</li>
                    <li>Access educational content</li>
                  </ul>
                </div>
                <div className="col-md-6">
                  <h5>Restrictions</h5>
                  <ul>
                    <li>No commercial use without permission</li>
                    <li>No copying or redistribution</li>
                    <li>No reverse engineering</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Termination */}
            <section className="mb-5">
              <h2 className="mb-4">Termination</h2>
              <p>
                We may terminate or suspend your access to the service at any time, with or without 
                cause or notice, for conduct that we believe violates these Terms or is harmful to 
                other users or the service.
              </p>
              <p>
                You may discontinue use of the service at any time. Upon termination, all provisions 
                of these Terms that by their nature should survive termination shall remain in effect.
              </p>
            </section>

            {/* Changes to Terms */}
            <section className="mb-5">
              <h2 className="mb-4">Changes to Terms</h2>
              <div className="alert alert-info">
                <p className="mb-0">
                  We reserve the right to modify these Terms at any time. Changes will be effective 
                  immediately upon posting. Your continued use of the service constitutes acceptance 
                  of any modifications.
                </p>
              </div>
            </section>

            {/* Governing Law */}
            <section className="mb-5">
              <h2 className="mb-4">Governing Law</h2>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of England 
                and Wales, without regard to conflict of law principles. Any disputes arising under 
                these Terms shall be subject to the exclusive jurisdiction of the courts of England and Wales.
              </p>
            </section>

            {/* Severability */}
            <section className="mb-5">
              <h2 className="mb-4">Severability</h2>
              <p>
                If any provision of these Terms is held to be invalid or unenforceable, the remaining 
                provisions shall remain in full force and effect. The invalid provision shall be 
                replaced with a valid provision that most closely reflects the intent of the original.
              </p>
            </section>

            {/* Contact Information */}
            <section className="mb-5">
              <h2 className="mb-4">Contact Information</h2>
              <div className="card">
                <div className="card-body">
                  <p>
                    If you have questions about these Terms of Service, please contact us:
                  </p>
                  <div className="row">
                    <div className="col-md-6">
                      <p>
                        <strong>Legal Matters:</strong><br />
                        <a href="mailto:legal@ibkr-tax-calculator.com">
                          legal@ibkr-tax-calculator.com
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

            {/* Footer */}
            <section className="text-center py-4 border-top">
              <div className="row">
                <div className="col-md-6">
                  <small className="text-muted">
                    <strong>Effective Date:</strong> September 2024
                  </small>
                </div>
                <div className="col-md-6">
                  <small className="text-muted">
                    <strong>Version:</strong> 1.0
                  </small>
                </div>
              </div>
              <div className="mt-3">
                <a href="/privacy" className="btn btn-outline-primary btn-sm me-2">
                  <i className="bi bi-shield-check me-1"></i>
                  Privacy Policy
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

export default Terms;