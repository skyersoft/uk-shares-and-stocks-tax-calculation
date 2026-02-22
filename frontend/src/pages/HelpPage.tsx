import React from 'react';
import { AffiliateGrid } from '../components/affiliate';
import { FeedbackForm } from '../components/feedback/FeedbackForm';

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
                            Supported types: BUY, SELL, DIVIDEND, SPLIT, TRANSFER_IN, TRANSFER_OUT. Dates should be YYYY-MM-DD or DD/MM/YYYY.
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
                            <li><strong>Currency:</strong> Foreign currency transactions should be in GBP or include exchange rates in your CSV file.</li>
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
                          <p>Your financial data is processed securely and is not stored permanently on our servers.</p>
                          <ul>
                            <li><strong>Processing:</strong> Files are uploaded to our secure backend for calculation, then immediately deleted after processing</li>
                            <li><strong>No Storage:</strong> We do not retain your transaction data, files, or calculation results</li>
                            <li><strong>Temporary Only:</strong> Data exists only during the calculation process (typically seconds)</li>
                            <li><strong>HTTPS:</strong> All data transmission is encrypted using industry-standard SSL/TLS</li>
                          </ul>
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

              {/* Broker-Specific Documentation */}
              <div className="row mt-5">
                <div className="col-12">
                  <h2>Supported Brokers</h2>
                  <p className="lead">
                    Detailed information about CSV formats and requirements for each supported broker.
                  </p>

                  <div className="accordion" id="brokerAccordion">
                    {/* Trading 212 */}
                    <div className="accordion-item">
                      <h2 className="accordion-header">
                        <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#trading212">
                          <strong>Trading 212</strong> - Full Support with Exchange Rates
                        </button>
                      </h2>
                      <div id="trading212" className="accordion-collapse collapse" data-bs-parent="#brokerAccordion">
                        <div className="accordion-body">
                          <div className="alert alert-success">
                            <strong>✅ Exchange Rates:</strong> Trading 212 CSVs include exchange rates - no manual conversion needed!
                          </div>
                          <h6>Expected Columns:</h6>
                          <ul className="small">
                            <li><code>Action</code> - Transaction type (Buy, Sell, Dividend, etc.)</li>
                            <li><code>Time</code> - Date and time (YYYY-MM-DD HH:MM:SS)</li>
                            <li><code>ISIN</code> - Security identifier</li>
                            <li><code>Ticker</code> - Stock symbol</li>
                            <li><code>Name</code> - Security name</li>
                            <li><code>No. of shares</code> - Quantity</li>
                            <li><code>Price / share</code> - Price per share</li>
                            <li><code>Currency (Price / share)</code> - Transaction currency</li>
                            <li><code>Exchange rate</code> - FX rate to GBP (if applicable)</li>
                            <li><code>Total</code> - Total amount</li>
                            <li><code>Withholding tax</code>, <code>Stamp duty reserve tax</code>, <code>Currency conversion fee</code> - Fees</li>
                          </ul>

                          <h6 className="mt-3">Sample CSV Content:</h6>
                          <pre className="bg-light p-2 rounded small" style={{ whiteSpace: 'pre-wrap' }}>{`Action,Time,ISIN,Ticker,Name,No. of shares,Price / share,Currency (Price / share),Exchange rate,Result,Total,Withholding tax,Currency conversion fee
Market buy,2024-01-15 14:30:00,US0378331005,AAPL,Apple Inc,10,150.00,USD,0.78,0.00,1175.00,0.00,5.00
Dividend (Ordinary),2024-03-01 10:00:00,US0378331005,AAPL,Apple Inc,10,0.24,USD,0.79,0.00,1.89,0.30,0.00`}</pre>
                          <a href="/samples/trading212-sample.csv" download className="btn btn-sm btn-outline-primary mt-2 mb-3">
                            <i className="bi bi-download me-1"></i>Download Sample CSV
                          </a>
                          <h6>How to Export:</h6>
                          <ol className="small">
                            <li>Log into Trading 212</li>
                            <li>Go to History → Export</li>
                            <li>Select date range and download CSV</li>
                          </ol>
                        </div>
                      </div>
                    </div>

                    {/* Interactive Brokers */}
                    <div className="accordion-item">
                      <h2 className="accordion-header">
                        <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#ibkr">
                          <strong>Interactive Brokers (IBKR)</strong> - QFX Format
                        </button>
                      </h2>
                      <div id="ibkr" className="accordion-collapse collapse" data-bs-parent="#brokerAccordion">
                        <div className="accordion-body">
                          <div className="alert alert-info">
                            <strong>ℹ️ Format:</strong> IBKR uses QFX files, not CSV. Upload your Activity Statement in QFX format.
                          </div>
                          <h6>How to Export:</h6>
                          <ol className="small">
                            <li>Log into IBKR Client Portal</li>
                            <li>Go to Performance & Reports → Statements</li>
                            <li>Select Activity Statement</li>
                            <li>Choose date range and format: <strong>QFX</strong></li>
                            <li>Download and upload to calculator</li>
                          </ol>
                          <p className="small text-muted mb-0">
                            The calculator automatically processes trades, dividends, and corporate actions from QFX files.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Interactive Brokers (CSV) */}
                    <div className="accordion-item">
                      <h2 className="accordion-header">
                        <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#ibkrCsv">
                          <strong>Interactive Brokers / Sharesight</strong> - CSV Format
                        </button>
                      </h2>
                      <div id="ibkrCsv" className="accordion-collapse collapse" data-bs-parent="#brokerAccordion">
                        <div className="accordion-body">
                          <p>Standard CSV format used by Sharesight and Interactive Brokers Flex Queries.</p>
                          <h6>Required Columns:</h6>
                          <ul className="small">
                            <li><code>Symbol</code> - Stock ticker</li>
                            <li><code>TradeDate</code> - Transaction date</li>
                            <li><code>Buy/Sell</code> or <code>Code</code> - Transaction type (Code: O=Buy, C=Sell)</li>
                            <li><code>Quantity</code> - Number of shares</li>
                            <li><code>TradePrice</code> or <code>UnitPrice</code> - Price per share</li>
                            <li><code>CurrencyPrimary</code> - Currency (e.g., USD, GBP)</li>
                          </ul>
                          <h6>Optional Columns:</h6>
                          <ul className="small">
                            <li><code>IBCommission</code> or <code>Commission</code> - Fees</li>
                            <li><code>FXRateToBase</code> - Exchange rate to GBP</li>
                            <li><code>AssetClass</code> - e.g., STK, CASH</li>
                            <li><code>Description</code> - Security name</li>
                          </ul>

                          <h6 className="mt-3">Sample CSV Content:</h6>
                          <pre className="bg-light p-2 rounded small" style={{ whiteSpace: 'pre-wrap' }}>{`Symbol,TradeDate,Buy/Sell,Quantity,TradePrice,CurrencyPrimary,IBCommission,FXRateToBase
AAPL,2024-01-15,BUY,10,150.00,USD,1.00,0.78
AAPL,2024-06-20,SELL,5,180.00,USD,1.00,0.79
MSFT,2024-03-01,DIV,1,2.50,USD,0.00,0.79`}</pre>
                        </div>
                      </div>
                    </div>

                    {/* Freetrade */}
                    <div className="accordion-item">
                      <h2 className="accordion-header">
                        <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#freetrade">
                          <strong>Freetrade</strong> - CSV Export
                        </button>
                      </h2>
                      <div id="freetrade" className="accordion-collapse collapse" data-bs-parent="#brokerAccordion">
                        <div className="accordion-body">
                          <div className="alert alert-warning">
                            <strong>⚠️ Currency:</strong> Freetrade CSVs do NOT include exchange rates. Ensure all transactions are in GBP or manually convert foreign currency values.
                          </div>
                          <h6>Expected Columns:</h6>
                          <ul className="small">
                            <li><code>Date</code> - Transaction date (YYYY-MM-DD)</li>
                            <li><code>Type</code> - BUY, SELL, DIVIDEND, etc.</li>
                            <li><code>Ticker</code> - Stock symbol</li>
                            <li><code>Name</code> - Security name</li>
                            <li><code>Quantity</code> - Number of shares</li>
                            <li><code>Price</code> - Price per share</li>
                            <li><code>Total</code> - Total amount</li>
                            <li><code>Currency</code> - Transaction currency (GBP, USD, EUR)</li>
                            <li><code>Fee</code> - Trading fees</li>
                          </ul>

                          <h6 className="mt-3">Sample CSV Content:</h6>
                          <pre className="bg-light p-2 rounded small" style={{ whiteSpace: 'pre-wrap' }}>{`Date,Type,Symbol,Quantity,Price,Fees,Currency,Name
2024-01-15,BUY,AAPL,10,150.00,1.50,USD,Apple Inc
2024-06-20,SELL,AAPL,5,180.00,1.50,USD,Apple Inc
2024-03-01,DIVIDEND,AAPL,10,0.24,0.00,USD,Apple Inc`}</pre>
                          <a href="/samples/freetrade-sample.csv" download className="btn btn-sm btn-outline-primary mt-2 mb-3">
                            <i className="bi bi-download me-1"></i>Download Sample CSV
                          </a>
                          <h6>How to Export:</h6>
                          <ol className="small">
                            <li>Open Freetrade app</li>
                            <li>Go to Account → Statements</li>
                            <li>Request transaction history export</li>
                            <li>Download CSV file</li>
                          </ol>
                          <p className="small text-danger">
                            <strong>Important:</strong> If you have USD/EUR stocks, you must manually convert prices to GBP in your CSV before uploading.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Fidelity */}
                    <div className="accordion-item">
                      <h2 className="accordion-header">
                        <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#fidelity">
                          <strong>Fidelity UK</strong> - CSV Export
                        </button>
                      </h2>
                      <div id="fidelity" className="accordion-collapse collapse" data-bs-parent="#brokerAccordion">
                        <div className="accordion-body">
                          <div className="alert alert-warning">
                            <strong>⚠️ Currency:</strong> Fidelity CSVs do NOT include exchange rates. Ensure all transactions are in GBP or manually convert foreign currency values.
                          </div>
                          <h6>Expected Columns:</h6>
                          <ul className="small">
                            <li><code>Trade Date</code> - Transaction date</li>
                            <li><code>Settlement Date</code> - Settlement date</li>
                            <li><code>Action</code> - Transaction type (YOU BOUGHT, YOU SOLD, DIVIDEND)</li>
                            <li><code>Symbol</code> - Stock ticker</li>
                            <li><code>Security Description</code> - Security name</li>
                            <li><code>Quantity</code> - Number of shares</li>
                            <li><code>Price</code> - Price per share</li>
                            <li><code>Amount</code> - Total amount</li>
                            <li><code>Commission</code> - Trading commission</li>
                            <li><code>Fees</code> - Other fees</li>
                            <li><code>Settlement Currency</code> - Currency (GBP, USD, EUR)</li>
                          </ul>

                          <h6 className="mt-3">Sample CSV Content:</h6>
                          <pre className="bg-light p-2 rounded small" style={{ whiteSpace: 'pre-wrap' }}>{`Trade Date,Settlement Date,Action,Symbol,Security Description,Quantity,Price,Amount,Settlement Currency,Commission
15/01/2024,17/01/2024,YOU BOUGHT,AAPL,APPLE INC,10,150.00,-1500.00,USD,0.00
20/06/2024,22/06/2024,YOU SOLD,AAPL,APPLE INC,5,180.00,900.00,USD,0.00
01/03/2024,01/03/2024,DIVIDEND,AAPL,APPLE INC DIVIDEND,10,0.24,2.40,USD,0.00`}</pre>
                          <a href="/samples/fidelity-sample.csv" download className="btn btn-sm btn-outline-primary mt-2 mb-3">
                            <i className="bi bi-download me-1"></i>Download Sample CSV
                          </a>
                          <h6>Date Format:</h6>
                          <p className="small">Supports DD/MM/YYYY or YYYY-MM-DD</p>
                        </div>
                      </div>
                    </div>

                    {/* Hargreaves Lansdown */}
                    <div className="accordion-item">
                      <h2 className="accordion-header">
                        <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#hl">
                          <strong>Hargreaves Lansdown</strong> - CSV Export
                        </button>
                      </h2>
                      <div id="hl" className="accordion-collapse collapse" data-bs-parent="#brokerAccordion">
                        <div className="accordion-body">
                          <div className="alert alert-info">
                            <strong>ℹ️ Assumption:</strong> HL converts all foreign transactions to GBP. All values are treated as GBP.
                          </div>
                          <h6>Expected Columns:</h6>
                          <ul className="small">
                            <li><code>Date</code> - Transaction date (DD/MM/YYYY)</li>
                            <li><code>Transaction Type</code> - Purchase, Sale, Dividend, etc.</li>
                            <li><code>Security</code> - Security name</li>
                            <li><code>ISIN</code> - Security identifier</li>
                            <li><code>Quantity</code> - Number of shares</li>
                            <li><code>Price</code> - Price per share (may be in pence)</li>
                            <li><code>Value</code> - Total value in GBP</li>
                            <li><code>Account Type</code> - ISA, SIPP, etc.</li>
                          </ul>

                          <h6 className="mt-3">Sample CSV Content:</h6>
                          <pre className="bg-light p-2 rounded small" style={{ whiteSpace: 'pre-wrap' }}>{`Date,Transaction Type,Notes,Security,ISIN,Quantity,Price,Value
15/01/2024,Purchase,,Apple Inc,US0378331005,10,150.00,1500.00
20/06/2024,Sale,,Apple Inc,US0378331005,5,180.00,900.00
01/03/2024,Dividend,,Apple Inc Dividend,US0378331005,10,0.24,2.40`}</pre>
                          <a href="/samples/hargreaves-lansdown-sample.csv" download className="btn btn-sm btn-outline-primary mt-2 mb-3">
                            <i className="bi bi-download me-1"></i>Download Sample CSV
                          </a>
                          <h6>Special Handling:</h6>
                          <ul className="small">
                            <li>Automatically detects if prices are in pence and converts to pounds</li>
                            <li>ISA and SIPP accounts are flagged for tax-exempt treatment</li>
                            <li>No ticker symbol provided - uses ISIN or security name</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Generic CSV */}
                    <div className="accordion-item">
                      <h2 className="accordion-header">
                        <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#genericCsv">
                          <strong>Generic CSV</strong> - Custom Format
                        </button>
                      </h2>
                      <div id="genericCsv" className="accordion-collapse collapse" data-bs-parent="#brokerAccordion">
                        <div className="accordion-body">
                          <p>If your broker isn't listed above, you can create a custom CSV with these columns:</p>
                          <h6>Required Columns:</h6>
                          <ul className="small">
                            <li><code>Date</code> - YYYY-MM-DD or DD/MM/YYYY</li>
                            <li><code>Type</code> - BUY, SELL, DIVIDEND, SPLIT, TRANSFER_IN, TRANSFER_OUT</li>
                            <li><code>Symbol</code> - Stock ticker</li>
                            <li><code>Quantity</code> - Number of shares (positive for buys, negative for sells)</li>
                            <li><code>Price</code> - Price per share</li>
                          </ul>
                          <h6>Optional Columns:</h6>
                          <ul className="small">
                            <li><code>Fees</code> - Trading fees and commissions</li>
                            <li><code>Currency</code> - Transaction currency (default: GBP)</li>
                            <li><code>Name</code> - Security name</li>
                          </ul>

                          <h6 className="mt-3">Sample CSV Content:</h6>
                          <pre className="bg-light p-2 rounded small" style={{ whiteSpace: 'pre-wrap' }}>{`Date,Type,Symbol,Name,Quantity,Price,Fees,Currency
2024-01-15,BUY,AAPL,Apple Inc,10,150.00,1.50,GBP
2024-06-20,SELL,AAPL,Apple Inc,5,180.00,1.50,GBP
2024-03-01,DIVIDEND,AAPL,Apple Inc,10,0.24,0.00,GBP
2024-02-10,BUY,TSLA,Tesla Inc,20,200.00,5.00,GBP`}</pre>
                          <a href="/samples/generic-sample.csv" download className="btn btn-sm btn-outline-primary mt-2 mb-3">
                            <i className="bi bi-download me-1"></i>Download Sample CSV
                          </a>

                          <div className="alert alert-info mt-3">
                            <strong><i className="bi bi-info-circle"></i> Note:</strong> For SELL transactions, you can use either a negative quantity (e.g., -5) or just "SELL" as the type with a positive quantity. The calculator handles both.
                          </div>
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

              {/* Feedback Form */}
              <FeedbackForm />

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