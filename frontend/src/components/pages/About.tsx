import React from 'react';

interface AboutProps {
  className?: string;
}

export const About: React.FC<AboutProps> = ({ className = '' }) => {
  return (
    <div className={`about-page ${className}`}>
      {/* Hero Section */}
      <section className="hero-section bg-primary text-white py-5">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6">
              <h1 className="display-4 fw-bold mb-4">About IBKR Tax Calculator</h1>
              <p className="lead mb-4">
                Making UK capital gains tax calculations simple, accurate, and stress-free for individual investors.
              </p>
            </div>
            <div className="col-lg-6">
              <div className="text-center">
                <i className="bi bi-calculator" style={{ fontSize: '8rem', opacity: 0.8 }}></i>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="mission-section py-5">
        <div className="container">
          <div className="row">
            <div className="col-lg-8 mx-auto text-center">
              <h2 className="mb-4">Our Mission</h2>
              <p className="lead">
                We aim to simplify UK capital gains tax calculations for individual investors trading through 
                Interactive Brokers and other platforms. Our mission is to provide accurate, reliable, and 
                easy-to-use tools that help you stay compliant with HMRC requirements.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="features-section py-5 bg-light">
        <div className="container">
          <h2 className="text-center mb-5">Key Features</h2>
          <div className="row g-4">
            <div className="col-md-4">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body text-center">
                  <i className="bi bi-calculator-fill text-primary mb-3" style={{ fontSize: '3rem' }}></i>
                  <h5 className="card-title">Accurate Calculations</h5>
                  <p className="card-text">
                    Precise Section 104 pool calculations following HMRC guidelines for shares and securities.
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body text-center">
                  <i className="bi bi-file-earmark-spreadsheet-fill text-primary mb-3" style={{ fontSize: '3rem' }}></i>
                  <h5 className="card-title">Multiple File Formats</h5>
                  <p className="card-text">
                    Support for QFX, CSV, and other common export formats from major trading platforms.
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body text-center">
                  <i className="bi bi-graph-up text-primary mb-3" style={{ fontSize: '3rem' }}></i>
                  <h5 className="card-title">Detailed Reports</h5>
                  <p className="card-text">
                    Comprehensive reports with transaction history, gain/loss breakdowns, and tax summaries.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="team-section py-5">
        <div className="container">
          <h2 className="text-center mb-5">Our Team</h2>
          <div className="row">
            <div className="col-lg-6 mb-4">
              <div className="d-flex align-items-start">
                <i className="bi bi-people-fill text-primary me-3" style={{ fontSize: '3rem' }}></i>
                <div>
                  <h5>Tax Experts</h5>
                  <p>
                    Our team includes qualified tax professionals with deep knowledge of UK capital gains tax 
                    regulations and HMRC requirements.
                  </p>
                </div>
              </div>
            </div>
            <div className="col-lg-6 mb-4">
              <div className="d-flex align-items-start">
                <i className="bi bi-code-slash text-primary me-3" style={{ fontSize: '3rem' }}></i>
                <div>
                  <h5>Software Engineers</h5>
                  <p>
                    Experienced developers building robust, secure, and user-friendly financial calculation tools.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="technology-section py-5 bg-light">
        <div className="container">
          <h2 className="text-center mb-5">Technology</h2>
          <div className="row">
            <div className="col-lg-8 mx-auto">
              <p className="text-center mb-4">
                Built with modern web technologies for reliability, security, and performance:
              </p>
              <div className="row text-center">
                <div className="col-md-3 mb-3">
                  <div className="tech-item">
                    <i className="bi bi-filetype-tsx text-primary mb-2" style={{ fontSize: '2rem' }}></i>
                    <p><strong>React</strong><br />Modern UI framework</p>
                  </div>
                </div>
                <div className="col-md-3 mb-3">
                  <div className="tech-item">
                    <i className="bi bi-code-square text-primary mb-2" style={{ fontSize: '2rem' }}></i>
                    <p><strong>TypeScript</strong><br />Type-safe development</p>
                  </div>
                </div>
                <div className="col-md-3 mb-3">
                  <div className="tech-item">
                    <i className="bi bi-bootstrap text-primary mb-2" style={{ fontSize: '2rem' }}></i>
                    <p><strong>Bootstrap</strong><br />Responsive design</p>
                  </div>
                </div>
                <div className="col-md-3 mb-3">
                  <div className="tech-item">
                    <i className="bi bi-shield-check text-primary mb-2" style={{ fontSize: '2rem' }}></i>
                    <p><strong>Security</strong><br />Client-side processing</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security & Privacy */}
      <section className="security-section py-5">
        <div className="container">
          <div className="row">
            <div className="col-lg-8 mx-auto text-center">
              <h2 className="mb-4">Security & Privacy</h2>
              <p className="lead mb-4">
                Your data remains private and secure. All calculations are performed locally in your browser - 
                your financial information never leaves your device.
              </p>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <div className="d-flex align-items-center">
                    <i className="bi bi-laptop text-primary me-3" style={{ fontSize: '2rem' }}></i>
                    <div className="text-start">
                      <h6>Local Processing</h6>
                      <small className="text-muted">No data uploaded to servers</small>
                    </div>
                  </div>
                </div>
                <div className="col-md-6 mb-3">
                  <div className="d-flex align-items-center">
                    <i className="bi bi-shield-lock text-primary me-3" style={{ fontSize: '2rem' }}></i>
                    <div className="text-start">
                      <h6>Secure by Design</h6>
                      <small className="text-muted">No tracking or data collection</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq-section py-5 bg-light">
        <div className="container">
          <h2 className="text-center mb-5">Frequently Asked Questions</h2>
          <div className="row">
            <div className="col-lg-8 mx-auto">
              <div className="accordion" id="faqAccordion">
                <div className="accordion-item">
                  <h3 className="accordion-header">
                    <button 
                      className="accordion-button" 
                      type="button" 
                      data-bs-toggle="collapse" 
                      data-bs-target="#faq1"
                    >
                      How accurate are the calculations?
                    </button>
                  </h3>
                  <div id="faq1" className="accordion-collapse collapse show" data-bs-parent="#faqAccordion">
                    <div className="accordion-body">
                      Our calculations follow HMRC guidelines exactly, implementing Section 104 pooling rules 
                      and same-day/bed-and-breakfast matching as specified in the Capital Gains Manual.
                    </div>
                  </div>
                </div>
                
                <div className="accordion-item">
                  <h3 className="accordion-header">
                    <button 
                      className="accordion-button collapsed" 
                      type="button" 
                      data-bs-toggle="collapse" 
                      data-bs-target="#faq2"
                    >
                      What file formats are supported?
                    </button>
                  </h3>
                  <div id="faq2" className="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                    <div className="accordion-body">
                      We support QFX files from Interactive Brokers, CSV exports from various platforms, 
                      and manual transaction entry for maximum flexibility.
                    </div>
                  </div>
                </div>

                <div className="accordion-item">
                  <h3 className="accordion-header">
                    <button 
                      className="accordion-button collapsed" 
                      type="button" 
                      data-bs-toggle="collapse" 
                      data-bs-target="#faq3"
                    >
                      Is my data secure?
                    </button>
                  </h3>
                  <div id="faq3" className="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                    <div className="accordion-body">
                      Yes, absolutely. All processing happens in your browser - no data is sent to our servers. 
                      Your financial information stays private and secure on your device.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="contact-section py-5">
        <div className="container">
          <div className="row">
            <div className="col-lg-6 mx-auto text-center">
              <h2 className="mb-4">Get in Touch</h2>
              <p className="mb-4">
                Have questions or suggestions? We'd love to hear from you.
              </p>
              <div className="d-flex justify-content-center gap-3">
                <a href="/help" className="btn btn-primary">
                  <i className="bi bi-question-circle me-2"></i>
                  Help & Support
                </a>
                <a href="mailto:support@ibkr-tax-calculator.com" className="btn btn-outline-primary">
                  <i className="bi bi-envelope me-2"></i>
                  Contact Us
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Info */}
      <section className="footer-info py-4 bg-dark text-white">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-md-6">
              <small>
                <strong>Version:</strong> 1.0.0 | 
                <strong> Last Updated:</strong> September 2024
              </small>
            </div>
            <div className="col-md-6 text-md-end">
              <small>
                Made with ❤️ for UK investors
              </small>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;