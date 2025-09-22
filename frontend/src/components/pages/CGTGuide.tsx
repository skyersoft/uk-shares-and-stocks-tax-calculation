import React, { useState } from 'react';

export interface CGTGuideProps {
  className?: string;
}

interface CalculationExample {
  id: string;
  title: string;
  description: string;
  data: {
    acquisitions: Array<{
      date: string;
      quantity: number;
      price: number;
      costs: number;
    }>;
    disposal: {
      date: string;
      quantity: number;
      price: number;
      costs: number;
    };
  };
  result?: {
    gain: number;
    taxable: number;
    poolAverage: number;
  };
}

const calculationExamples: CalculationExample[] = [
  {
    id: 'basic',
    title: 'Basic Disposal',
    description: 'Single purchase scenario with straightforward disposal',
    data: {
      acquisitions: [
        { date: '2023-01-15', quantity: 100, price: 50, costs: 25 }
      ],
      disposal: { date: '2024-02-20', quantity: 50, price: 75, costs: 25 }
    }
  },
  {
    id: 'multiple',
    title: 'Multiple Acquisitions',
    description: 'Multiple purchases scenario with Section 104 pooling',
    data: {
      acquisitions: [
        { date: '2022-06-10', quantity: 100, price: 40, costs: 20 },
        { date: '2023-03-15', quantity: 50, price: 60, costs: 15 }
      ],
      disposal: { date: '2024-01-10', quantity: 75, price: 80, costs: 30 }
    }
  }
];

export const CGTGuide: React.FC<CGTGuideProps> = ({ className = '' }) => {
  const [activeExample, setActiveExample] = useState('basic');
  const [currentStep, setCurrentStep] = useState(1);
  const [calculationResult, setCalculationResult] = useState<any>(null);

  const calculateExample = () => {
    const example = calculationExamples.find(ex => ex.id === activeExample);
    if (!example) return;

    // Simplified calculation for demonstration
    const totalAcquisitionCost = example.data.acquisitions.reduce(
      (sum, acq) => sum + (acq.quantity * acq.price) + acq.costs, 0
    );
    const totalQuantity = example.data.acquisitions.reduce(
      (sum, acq) => sum + acq.quantity, 0
    );
    const poolAverage = totalAcquisitionCost / totalQuantity;
    
    const disposalProceeds = (example.data.disposal.quantity * example.data.disposal.price) - example.data.disposal.costs;
    const disposalCost = example.data.disposal.quantity * poolAverage;
    const gain = disposalProceeds - disposalCost;

    const result = {
      gain: gain,
      taxable: Math.max(0, gain),
      poolAverage: poolAverage,
      disposalProceeds,
      disposalCost
    };

    setCalculationResult(result);
  };

  const nextStep = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const stepContent = [
    {
      title: "Identify Your Transactions",
      content: "Gather all buy and sell transactions for each security. Include dates, quantities, prices, and transaction costs."
    },
    {
      title: "Apply HMRC Matching Rules",
      content: "Match disposals with acquisitions using same-day rule first, then bed-and-breakfast rule (30-day rule), then Section 104 pool."
    },
    {
      title: "Calculate Section 104 Pool",
      content: "For remaining shares, calculate the average cost per share using the Section 104 pooling method."
    },
    {
      title: "Determine Gains and Losses",
      content: "Calculate the gain or loss for each disposal by subtracting the acquisition cost from disposal proceeds."
    },
    {
      title: "Apply Annual Exemption",
      content: "Offset gains against the annual exempt amount (£6,000 for 2023/24 tax year) and calculate tax liability."
    }
  ];

  return (
    <div className={`cgt-guide ${className}`}>
      {/* Hero Section */}
      <section className="hero-section bg-primary text-white py-5">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-8">
              <h1 className="display-4 fw-bold mb-4">Capital Gains Tax Guide</h1>
              <p className="lead mb-4">
                A comprehensive guide to UK Capital Gains Tax calculations for individual investors.
              </p>
            </div>
            <div className="col-lg-4 text-center">
              <i className="bi bi-book" style={{ fontSize: '6rem', opacity: 0.8 }}></i>
            </div>
          </div>
        </div>
      </section>

      <div className="container py-5">
        {/* Introduction */}
        <section className="mb-5">
          <div className="row">
            <div className="col-lg-8 mx-auto text-center">
              <h2 className="mb-4">Understanding UK Capital Gains Tax</h2>
              <p className="lead">
                This comprehensive guide to UK Capital Gains Tax will help you understand the rules, 
                calculations, and reporting requirements for individual investors.
              </p>
            </div>
          </div>
        </section>

        {/* HMRC Rules */}
        <section className="mb-5">
          <h2 className="mb-4">HMRC Rules and Regulations</h2>
          <div className="row">
            <div className="col-md-4 mb-3">
              <div className="card h-100">
                <div className="card-body">
                  <h5 className="card-title text-primary">
                    <i className="bi bi-layers me-2"></i>
                    Section 104 Pooling
                  </h5>
                  <p className="card-text">
                    Shares of the same type are pooled together with an average cost calculation 
                    for disposals not covered by same-day or bed-and-breakfast rules.
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-4 mb-3">
              <div className="card h-100">
                <div className="card-body">
                  <h5 className="card-title text-primary">
                    <i className="bi bi-calendar-day me-2"></i>
                    Same-Day Rule
                  </h5>
                  <p className="card-text">
                    Acquisitions and disposals on the same day are matched first, using the 
                    actual cost of shares bought on that day.
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-4 mb-3">
              <div className="card h-100">
                <div className="card-body">
                  <h5 className="card-title text-primary">
                    <i className="bi bi-moon me-2"></i>
                    Bed and Breakfast Rule
                  </h5>
                  <p className="card-text">
                    Disposals are matched with acquisitions within 30 days after the disposal 
                    date, in chronological order.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Calculation Methods */}
        <section className="mb-5">
          <h2 className="mb-4">Calculation Methods</h2>
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Matching Order Priority</h5>
              <ol className="list-group list-group-numbered list-group-flush">
                <li className="list-group-item d-flex align-items-start">
                  <div className="fw-bold me-3">Same-Day Rule</div>
                  <div>Match with shares acquired on the same day as disposal</div>
                </li>
                <li className="list-group-item d-flex align-items-start">
                  <div className="fw-bold me-3">Bed and Breakfast Rule</div>
                  <div>Match with shares acquired within 30 days after disposal</div>
                </li>
                <li className="list-group-item d-flex align-items-start">
                  <div className="fw-bold me-3">Section 104 Pool</div>
                  <div>Match with shares from the pooled holding at average cost</div>
                </li>
              </ol>
            </div>
          </div>
        </section>

        {/* Interactive Examples */}
        <section className="mb-5">
          <h2 className="mb-4">Interactive Examples</h2>
          <div className="row">
            <div className="col-lg-4 mb-4">
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0">Select Example</h5>
                </div>
                <div className="card-body">
                  {calculationExamples.map(example => (
                    <button
                      key={example.id}
                      className={`btn btn-outline-primary w-100 mb-2 ${
                        activeExample === example.id ? 'active' : ''
                      }`}
                      onClick={() => setActiveExample(example.id)}
                    >
                      {example.title}
                    </button>
                  ))}
                  <button
                    className="btn btn-primary w-100 mt-3"
                    onClick={calculateExample}
                  >
                    Calculate Example
                  </button>
                </div>
              </div>
            </div>
            <div className="col-lg-8">
              {(() => {
                const example = calculationExamples.find(ex => ex.id === activeExample);
                return example ? (
                  <div className="card">
                    <div className="card-header">
                      <h5 className="mb-0">{example.title}</h5>
                    </div>
                    <div className="card-body">
                      <p className="text-muted mb-3">
                        {activeExample === 'basic' ? 'Single purchase scenario' : 'Multiple purchases scenario'}
                      </p>
                      
                      <h6>Acquisitions:</h6>
                      <div className="table-responsive mb-3">
                        <table className="table table-sm">
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Quantity</th>
                              <th>Price</th>
                              <th>Costs</th>
                              <th>Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {example.data.acquisitions.map((acq, i) => (
                              <tr key={i}>
                                <td>{acq.date}</td>
                                <td>{acq.quantity}</td>
                                <td>£{acq.price}</td>
                                <td>£{acq.costs}</td>
                                <td>£{(acq.quantity * acq.price) + acq.costs}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <h6>Disposal:</h6>
                      <div className="table-responsive mb-3">
                        <table className="table table-sm">
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Quantity</th>
                              <th>Price</th>
                              <th>Costs</th>
                              <th>Proceeds</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td>{example.data.disposal.date}</td>
                              <td>{example.data.disposal.quantity}</td>
                              <td>£{example.data.disposal.price}</td>
                              <td>£{example.data.disposal.costs}</td>
                              <td>£{(example.data.disposal.quantity * example.data.disposal.price) - example.data.disposal.costs}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {calculationResult && (
                        <div className="alert alert-success">
                          <h6>Calculation Result:</h6>
                          <p className="mb-1"><strong>Pool Average Cost:</strong> £{calculationResult.poolAverage.toFixed(2)}</p>
                          <p className="mb-1"><strong>Disposal Proceeds:</strong> £{calculationResult.disposalProceeds.toFixed(2)}</p>
                          <p className="mb-1"><strong>Disposal Cost:</strong> £{calculationResult.disposalCost.toFixed(2)}</p>
                          <p className="mb-0"><strong>Capital Gain:</strong> £{calculationResult.gain.toFixed(2)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : null;
              })()}
            </div>
          </div>
        </section>

        {/* Step-by-Step Walkthrough */}
        <section className="mb-5">
          <h2 className="mb-4">Step-by-Step Walkthrough</h2>
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Step {currentStep} of 5</h5>
              <div className="progress" style={{ width: '200px' }}>
                <div 
                  className="progress-bar" 
                  role="progressbar"
                  style={{ width: `${(currentStep / 5) * 100}%` }}
                  aria-valuenow={currentStep}
                  aria-valuemin={1}
                  aria-valuemax={5}
                >
                  {currentStep} of 5
                </div>
              </div>
            </div>
            <div className="card-body">
              <h5>{stepContent[currentStep - 1].title}</h5>
              <p>{stepContent[currentStep - 1].content}</p>
              
              <div className="d-flex justify-content-between mt-4">
                <button 
                  className="btn btn-outline-secondary"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                >
                  Previous Step
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={nextStep}
                  disabled={currentStep === 5}
                >
                  Next Step
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Practical Scenarios */}
        <section className="mb-5">
          <h2 className="mb-4">Practical Scenarios</h2>
          <div className="row">
            <div className="col-md-6 mb-3">
              <div className="card h-100">
                <div className="card-body">
                  <h5 className="card-title">
                    <i className="bi bi-gift me-2 text-success"></i>
                    Bonus Share Allocations
                  </h5>
                  <p className="card-text">
                    Bonus shares are added to your Section 104 pool at zero cost, reducing 
                    the average cost per share of your holding.
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-6 mb-3">
              <div className="card h-100">
                <div className="card-body">
                  <h5 className="card-title">
                    <i className="bi bi-scissors me-2 text-info"></i>
                    Stock Splits
                  </h5>
                  <p className="card-text">
                    Stock splits increase the number of shares in your pool while maintaining 
                    the same total cost, effectively reducing cost per share.
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-6 mb-3">
              <div className="card h-100">
                <div className="card-body">
                  <h5 className="card-title">
                    <i className="bi bi-currency-exchange me-2 text-warning"></i>
                    Foreign Currency Considerations
                  </h5>
                  <p className="card-text">
                    For foreign shares, convert all amounts to GBP using exchange rate 
                    on the transaction date for both acquisitions and disposals.
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-6 mb-3">
              <div className="card h-100">
                <div className="card-body">
                  <h5 className="card-title">
                    <i className="bi bi-cash me-2 text-primary"></i>
                    Dividend Payments
                  </h5>
                  <p className="card-text">
                    Dividend payments are not part of capital gains calculations but may 
                    affect the cost basis for rights issues or scrip dividends.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Tax Rates and Allowances */}
        <section className="mb-5">
          <h2 className="mb-4">Tax Rates and Allowances</h2>
          <div className="row">
            <div className="col-md-6">
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0">2023/24 Tax Year</h5>
                </div>
                <div className="card-body">
                  <p><strong>Annual Exemption:</strong> £6,000</p>
                  <h6>Tax Rates:</h6>
                  <ul>
                    <li>Basic rate taxpayers: 10%</li>
                    <li>Higher rate taxpayers: 20%</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0">2024/25 Tax Year</h5>
                </div>
                <div className="card-body">
                  <p><strong>Annual Exemption:</strong> £3,000</p>
                  <h6>Tax Rates:</h6>
                  <ul>
                    <li>Basic rate taxpayers: 10%</li>
                    <li>Higher rate taxpayers: 20%</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Common Mistakes */}
        <section className="mb-5">
          <h2 className="mb-4">Common Mistakes</h2>
          <div className="alert alert-warning">
            <h5 className="alert-heading">
              <i className="bi bi-exclamation-triangle me-2"></i>
              Avoid These Common Errors
            </h5>
            <ul className="mb-0">
              <li><strong>Incorrect pooling calculations:</strong> Not properly maintaining Section 104 pool records</li>
              <li><strong>Missing bed-and-breakfast matching:</strong> Failing to identify purchases within 30 days</li>
              <li><strong>Exchange rate errors:</strong> Using wrong dates for currency conversion</li>
              <li><strong>Transaction cost omissions:</strong> Not including broker fees and stamp duty</li>
              <li><strong>Same-day rule oversight:</strong> Not matching same-day transactions first</li>
            </ul>
          </div>
        </section>

        {/* Reporting Requirements */}
        <section className="mb-5">
          <h2 className="mb-4">Reporting Requirements</h2>
          <div className="card">
            <div className="card-body">
              <h5>Self Assessment Requirements</h5>
              <p>You must report capital gains if:</p>
              <ul>
                <li>Your total disposals exceed £49,200 (2023/24), or</li>
                <li>Your taxable gains exceed the annual exemption</li>
              </ul>
              
              <h6 className="mt-4">What to Report:</h6>
              <div className="row">
                <div className="col-md-6">
                  <ul>
                    <li>Details of each disposal</li>
                    <li>Acquisition and disposal costs</li>
                    <li>Dates of transactions</li>
                  </ul>
                </div>
                <div className="col-md-6">
                  <ul>
                    <li>Calculation of gains/losses</li>
                    <li>Use of annual exemption</li>
                    <li>Any reliefs claimed</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Glossary */}
        <section className="mb-5">
          <h2 className="mb-4">Glossary</h2>
          <div className="row">
            <div className="col-md-6">
              <dl>
                <dt>Acquisition Cost</dt>
                <dd>The total cost of acquiring shares, including purchase price and transaction costs.</dd>
                
                <dt>Disposal Proceeds</dt>
                <dd>The amount received from selling shares, less transaction costs.</dd>
                
                <dt>Section 104 Pool</dt>
                <dd>A method of calculating average cost for shares of the same type.</dd>
              </dl>
            </div>
            <div className="col-md-6">
              <dl>
                <dt>Same-Day Rule</dt>
                <dd>Matching disposals with acquisitions made on the same day.</dd>
                
                <dt>Bed and Breakfast Rule</dt>
                <dd>Matching disposals with acquisitions within 30 days after disposal.</dd>
                
                <dt>Annual Exemption</dt>
                <dd>The amount of capital gains you can make each year without paying tax.</dd>
              </dl>
            </div>
          </div>
        </section>

        {/* Additional Resources */}
        <section className="mb-5">
          <h2 className="mb-4">Additional Resources</h2>
          <div className="card">
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <h6>Official HMRC Resources</h6>
                  <ul className="list-unstyled">
                    <li>
                      <a 
                        href="https://www.gov.uk/government/publications/capital-gains-manual" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-decoration-none"
                      >
                        <i className="bi bi-link-45deg me-2"></i>
                        HMRC Capital Gains Manual
                      </a>
                    </li>
                    <li>
                      <a 
                        href="https://www.gov.uk/capital-gains-tax" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-decoration-none"
                      >
                        <i className="bi bi-link-45deg me-2"></i>
                        Capital Gains Tax Guide
                      </a>
                    </li>
                  </ul>
                </div>
                <div className="col-md-6">
                  <h6>Tools and Calculators</h6>
                  <ul className="list-unstyled">
                    <li>
                      <a href="/" className="text-decoration-none">
                        <i className="bi bi-calculator me-2"></i>
                        IBKR Tax Calculator
                      </a>
                    </li>
                    <li>
                      <a href="/help" className="text-decoration-none">
                        <i className="bi bi-question-circle me-2"></i>
                        Help & Support
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Disclaimer */}
        <section className="alert alert-info">
          <h6 className="alert-heading">
            <i className="bi bi-info-circle me-2"></i>
            Important Disclaimer
          </h6>
          <p className="mb-0">
            This guide is for educational purposes only and does not constitute professional tax advice. 
            Tax rules can be complex and change over time. Always consult with a qualified tax professional 
            for advice specific to your circumstances.
          </p>
        </section>
      </div>
    </div>
  );
};

export default CGTGuide;