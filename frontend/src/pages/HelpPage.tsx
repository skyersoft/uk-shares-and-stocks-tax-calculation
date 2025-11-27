import React from 'react';
import { AffiliateGrid } from '../components/affiliate';

import SEOHead from '../components/seo/SEOHead';

const HelpPage: React.FC = () => {
  return (
    <div className="container py-4">
      <SEOHead
        title="Help & FAQ - UK Stock Tax Calculator"
        description="Frequently asked questions about using the UK Stock Tax Calculator. Learn how to upload files, understand calculations, and ensure data privacy."
        canonical="https://cgttaxtool.uk/help"
      />
      <div className="row justify-content-center">
        <div className="col-lg-10">
          <div className="card shadow">
            <div className="card-body">
              <h1 className="card-title">Help & FAQ</h1>
              <p className="lead">
                Get help with using the Tax Calculator and understanding UK Capital Gains Tax.
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
                        <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#csvFormat">
                          CSV File Format Guide
                        </button>
                      </h2>
                      <div id="csvFormat" className="accordion-collapse collapse" data-bs-parent="#gettingStartedAccordion">
                        <div className="accordion-body">
                          <p>If uploading a CSV file, please ensure it follows this format:</p>
                          <div className="table-responsive">
                            <table className="table table-sm table-bordered">
                              <thead>
                                <tr>
                                  <th>Date</th>
                                  <th>Type</th>
                                  <th>Symbol</th>
                                  <th>Quantity</th>
                                  <th>Price</th>
                                  <th>Fees</th>
                                  <th>Currency</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td>2024-01-15</td>
                                  <td>BUY</td>
                                  <td>AAPL</td>
                                  <td>10</td>
                                  <td>150.00</td>
                                  <td>5.00</td>
                                  <td>USD</td>
                                </tr>
                                <tr>
                                  <td>2024-06-20</td>
                                  <td>SELL</td>
                                  <td>AAPL</td>
                                  <td>5</td>
                                  <td>180.00</td>
                                  <td>2.00</td>
                                  <td>USD</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                          <p className="small text-muted">
                            Supported types: BUY, SELL, SPLIT, TRANSFER_OUT. Dates should be YYYY-MM-DD or DD/MM/YYYY.
                          </p>
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
                            <li><strong>Section 104 Pooling:</strong> Shares of the same class are pooled together. The cost basis is the weighted average cost of all shares in the pool.</li>
                            <li><strong>Same Day & 30-Day Rules:</strong> "Bed & Breakfast" rules are applied to prevent tax avoidance by selling and repurchasing shortly after.</li>
                            <li><strong>Spouse Transfers:</strong> Transfers to a spouse (TRANSFER_OUT) are handled as "no gain/no loss" disposals.</li>
                            <li><strong>Share Restructuring:</strong> Stock splits and consolidations (SPLIT) automatically adjust the share pool quantity while preserving the total cost basis.</li>
                            <li><strong>Allowable Costs:</strong> Broker fees and stamp duty are deducted from proceeds or added to cost basis.</li>
                            <li><strong>Currency:</strong> Foreign currency transactions are converted to GBP using HMRC-approved exchange rates.</li>
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
                  <p>If you can't find the answer you're looking for, or if you want to report an error or request a feature, please reach out on Reddit.</p>
                  <div className="d-flex gap-2">
                    <a href="#guide" className="btn btn-primary">View CGT Guide</a>
                    <a href="https://www.reddit.com/user/OpinionActual9772/" target="_blank" rel="noopener noreferrer" className="btn btn-outline-primary">Contact on Reddit</a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Resources Section */}
          <div className="mt-4">
            <div className="card shadow">
              <div className="card-body">
                <h2 className="h4 mb-3">
                  📖 Recommended Reading
                </h2>
                <p className="text-muted mb-4">
                  Expand your knowledge with these comprehensive guides to UK taxation and investment strategies
                </p>

                <AffiliateGrid
                  category="tax"
                  limit={4}
                  columns={{ xs: 1, sm: 2, md: 2 }}
                  showRatings={true}
                  showCategories={false}
                  layout="horizontal"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpPage;