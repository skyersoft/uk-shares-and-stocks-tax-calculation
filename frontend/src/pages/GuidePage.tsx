import React from 'react';

const GuidePage: React.FC = () => {
  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-lg-10">
          <div className="card shadow">
            <div className="card-body">
              <h1 className="card-title">UK Capital Gains Tax Guide</h1>
              <p className="lead">
                A comprehensive guide to understanding UK Capital Gains Tax for shares and investments.
              </p>
              
              <div className="row">
                <div className="col-lg-8">
                  <h2>What is Capital Gains Tax?</h2>
                  <p>
                    Capital Gains Tax (CGT) is a tax on the profit when you sell (or 'dispose of') something (an 'asset') that's gone up in value. 
                    It's the gain you make that's taxed, not the amount of money you receive.
                  </p>
                  
                  <h3>CGT Rates for 2024/25</h3>
                  <div className="table-responsive">
                    <table className="table table-striped">
                      <thead>
                        <tr>
                          <th>Tax Band</th>
                          <th>Rate (Shares)</th>
                          <th>Rate (Residential Property)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>Basic Rate</td>
                          <td>10%</td>
                          <td>18%</td>
                        </tr>
                        <tr>
                          <td>Higher Rate</td>
                          <td>20%</td>
                          <td>28%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  
                  <h3>Annual Exempt Amount</h3>
                  <p>
                    You can make gains of up to £6,000 (2024/25) before you need to pay Capital Gains Tax. 
                    This is known as your annual exempt amount or 'allowance'.
                  </p>
                  
                  <h3>Section 104 Holdings</h3>
                  <p>
                    When you buy shares of the same company at different times, they are pooled together in what's called a 'Section 104 holding'. 
                    This means you calculate the average cost when you sell shares.
                  </p>
                  
                  <div className="alert alert-info">
                    <h4 className="alert-heading">Example Calculation:</h4>
                    <p>If you bought 100 shares at £10 each and later bought 50 shares at £15 each:</p>
                    <ul>
                      <li>Total shares: 150</li>
                      <li>Total cost: (100 × £10) + (50 × £15) = £1,750</li>
                      <li>Average cost per share: £1,750 ÷ 150 = £11.67</li>
                    </ul>
                  </div>
                  
                  <h3>The 30-Day Rule</h3>
                  <p>
                    If you sell shares and buy the same shares within 30 days, special rules apply to prevent 'bed and breakfasting' 
                    (selling and immediately rebuying to crystallize losses).
                  </p>
                  
                  <h3>Allowable Costs</h3>
                  <p>You can deduct certain costs from your capital gain:</p>
                  <ul>
                    <li>The original cost of the asset</li>
                    <li>Costs of buying and selling (e.g., broker fees, stamp duty)</li>
                    <li>Costs of improving the asset</li>
                  </ul>
                </div>
                
                <div className="col-lg-4">
                  <div className="sticky-top" style={{top: '20px'}}>
                    <div className="card bg-light">
                      <div className="card-header">
                        <h5>Quick Links</h5>
                      </div>
                      <div className="card-body">
                        <ul className="list-unstyled">
                          <li><a href="#calculator" className="text-decoration-none">🧮 Use Calculator</a></li>
                          <li><a href="#help" className="text-decoration-none">❓ Get Help</a></li>
                          <li><a href="#about" className="text-decoration-none">ℹ️ About Us</a></li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="card bg-warning bg-opacity-10 mt-3">
                      <div className="card-body">
                        <h6 className="card-title">⚠️ Important</h6>
                        <p className="card-text small">
                          This guide provides general information only. Always consult with a qualified tax advisor for specific advice about your situation.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuidePage;