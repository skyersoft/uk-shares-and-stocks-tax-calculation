import React from 'react';

const HelpPage: React.FC = () => {
  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-lg-10">
          <div className="card shadow">
            <div className="card-body">
              <h1 className="card-title">Help & FAQ</h1>
              <p className="lead">
                Get help with using the IBKR Tax Calculator and understanding UK Capital Gains Tax.
              </p>
              
              <div className="row">
                <div className="col-md-6">
                  <h2>Getting Started</h2>
                  <div className="accordion" id="gettingStartedAccordion">
                    <div className="accordion-item">
                      <h2 className="accordion-header">
                        <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#fileUpload">
                          How to upload transaction files
                        </button>
                      </h2>
                      <div id="fileUpload" className="accordion-collapse collapse" data-bs-parent="#gettingStartedAccordion">
                        <div className="accordion-body">
                          <p>You can upload transaction data in two formats:</p>
                          <ul>
                            <li><strong>QFX files:</strong> Export from Interactive Brokers activity statements</li>
                            <li><strong>CSV files:</strong> Export from Sharesight or other portfolio platforms</li>
                          </ul>
                          <p>Simply click the "Choose File" button and select your file. The calculator will automatically detect the format and process your transactions.</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="accordion-item">
                      <h2 className="accordion-header">
                        <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#calculations">
                          Understanding the calculations
                        </button>
                      </h2>
                      <div id="calculations" className="accordion-collapse collapse" data-bs-parent="#gettingStartedAccordion">
                        <div className="accordion-body">
                          <p>The calculator follows HMRC guidelines for Capital Gains Tax:</p>
                          <ul>
                            <li>Uses Section 104 holding rules for share pooling</li>
                            <li>Applies 30-day rule for wash sales</li>
                            <li>Calculates allowable costs including broker fees</li>
                            <li>Accounts for currency conversions at HMRC rates</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="col-md-6">
                  <h2>Common Questions</h2>
                  <div className="accordion" id="faqAccordion">
                    <div className="accordion-item">
                      <h2 className="accordion-header">
                        <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#dataPrivacy">
                          Is my data secure?
                        </button>
                      </h2>
                      <div id="dataPrivacy" className="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                        <div className="accordion-body">
                          <p>Yes! All calculations are performed locally in your browser. Your financial data never leaves your device and is not stored on our servers.</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="accordion-item">
                      <h2 className="accordion-header">
                        <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#accuracy">
                          How accurate are the calculations?
                        </button>
                      </h2>
                      <div id="accuracy" className="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                        <div className="accordion-body">
                          <p>Our calculator follows HMRC guidelines and has been tested with various scenarios. However, always consult with a qualified tax advisor for official tax guidance.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
                <div className="alert alert-primary">
                  <h4 className="alert-heading">Need More Help?</h4>
                  <p>If you can't find the answer you're looking for, try our CGT Guide for detailed explanations of UK Capital Gains Tax rules.</p>
                  <a href="#guide" className="btn btn-primary">View CGT Guide</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpPage;