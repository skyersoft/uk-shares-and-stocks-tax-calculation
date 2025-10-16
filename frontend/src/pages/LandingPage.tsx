import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import AffiliateGrid from '../components/affiliate/AffiliateGrid';
import { AffiliateProduct } from '../types/affiliate';
import affiliateProductsData from '../data/affiliateProducts.json';

const LandingPage: React.FC = () => {
  console.log('[LandingPage] Component rendering');
  const navigate = useNavigate();

  const handleGetStarted = () => {
    console.log('[LandingPage] Start Calculation button clicked');
    navigate('/calculator');
  };

  const handleViewBlog = () => {
    navigate('/blog');
  };

  const handleViewGuide = () => {
    navigate('/guide');
  };

  // Get featured products from the JSON data
  const featuredProducts = affiliateProductsData.products
    .filter(product => product.featured)
    .slice(0, 6) // Show up to 6 featured products
    .map(product => ({
      ...product,
      // Ensure all required fields are present and properly typed
      fallbackImageUrl: (product as any).fallbackImageUrl || '/images/book-placeholder.jpg'
    })) as AffiliateProduct[];

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section py-5 mb-5" style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div className="container">
          <div className="row align-items-center min-vh-75">
            <div className="col-lg-7">
              <h1 className="display-3 fw-bold mb-4">
                UK Tax Calculator for
                <span className="d-block text-warning">Interactive Brokers</span>
              </h1>
              <p className="lead mb-4 fs-5">
                Calculate your UK capital gains tax, dividend income, and portfolio performance 
                from IBKR transactions. HMRC compliant calculations with detailed reporting.
              </p>
              
              <div className="d-flex gap-3 mb-4 flex-wrap">
                <button 
                  onClick={handleGetStarted}
                  className="btn btn-light btn-lg px-4 py-3 fw-semibold"
                >
                  <i className="fas fa-calculator me-2"></i>
                  Start Calculation
                </button>
                <button 
                  onClick={handleViewGuide}
                  className="btn btn-outline-light btn-lg px-4 py-3"
                >
                  <i className="fas fa-book me-2"></i>
                  CGT Guide
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="d-flex gap-4 text-light small opacity-90 flex-wrap">
                <div className="d-flex align-items-center">
                  <i className="fas fa-shield-alt me-2"></i>
                  HMRC Compliant
                </div>
                <div className="d-flex align-items-center">
                  <i className="fas fa-users me-2"></i>
                  10k+ Users
                </div>
                <div className="d-flex align-items-center">
                  <i className="fas fa-star me-2"></i>
                  Free to Use
                </div>
              </div>
            </div>

            <div className="col-lg-5">
              {/* Featured Ad Space */}
              <Card className="bg-white bg-opacity-10 backdrop-blur border-0 text-white">
                <div className="card-body text-center">
                  <h5 className="card-title text-warning mb-3">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    CGT Rate Changes 2024-25
                  </h5>
                  <p className="card-text mb-3">
                    Major capital gains tax increases from 30 October 2024:
                  </p>
                  <div className="row text-center mb-3">
                    <div className="col-6">
                      <small className="text-light">Before Oct 30</small>
                      <div className="fw-bold">10% | 20%</div>
                    </div>
                    <div className="col-6">
                      <small className="text-light">From Oct 30</small>
                      <div className="fw-bold text-warning">18% | 24%</div>
                    </div>
                  </div>
                  <button 
                    onClick={handleViewGuide}
                    className="btn btn-warning btn-sm"
                  >
                    Read Full Guide
                  </button>
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* Background Pattern */}
        <div
          className="position-absolute top-0 start-0 w-100 h-100 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
            pointerEvents: 'none'
          }}
        />
      </section>

      {/* Features Section */}
      <section className="py-5 mb-5">
        <div className="container">
          <div className="row text-center mb-5">
            <div className="col-lg-8 mx-auto">
              <h2 className="display-5 fw-bold mb-3">Why Choose Our Tax Calculator?</h2>
              <p className="lead text-muted">
                Comprehensive UK tax calculations designed specifically for Interactive Brokers users
              </p>
            </div>
          </div>
          
          <div className="row g-4">
            <div className="col-md-4">
              <Card className="feature-card h-100 border-0 shadow-sm">
                <div className="card-body text-center p-4">
                  <div className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '70px', height: '70px' }}>
                    <i className="fas fa-calculator fa-xl"></i>
                  </div>
                  <h5 className="card-title fw-bold mb-3">HMRC Compliant</h5>
                  <p className="card-text text-muted">
                    Accurate UK tax calculations following HMRC guidelines for capital gains, 
                    dividends, and currency gains.
                  </p>
                </div>
              </Card>
            </div>
            
            <div className="col-md-4">
              <Card className="feature-card h-100 border-0 shadow-sm">
                <div className="card-body text-center p-4">
                  <div className="bg-success text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '70px', height: '70px' }}>
                    <i className="fas fa-chart-line fa-xl"></i>
                  </div>
                  <h5 className="card-title fw-bold mb-3">Portfolio Analytics</h5>
                  <p className="card-text text-muted">
                    Comprehensive portfolio analysis with performance metrics, market breakdown, 
                    and current holdings.
                  </p>
                </div>
              </Card>
            </div>
            
            <div className="col-md-4">
              <Card className="feature-card h-100 border-0 shadow-sm">
                <div className="card-body text-center p-4">
                  <div className="bg-info text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '70px', height: '70px' }}>
                    <i className="fas fa-file-alt fa-xl"></i>
                  </div>
                  <h5 className="card-title fw-bold mb-3">Detailed Reports</h5>
                  <p className="card-text text-muted">
                    Generate comprehensive reports in multiple formats for tax filing 
                    and portfolio review.
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section - Enhanced with Tax Process Explanation */}
      <section className="py-5 mb-5 bg-light">
        <div className="container">
          <div className="row text-center mb-5">
            <div className="col-lg-10 mx-auto">
              <h2 className="display-5 fw-bold mb-3">How UK Capital Gains Tax Calculation Works</h2>
              <p className="lead text-muted mb-4">
                Understanding the tax calculation process helps you prepare the right data and interpret your results
              </p>
            </div>
          </div>

          <div className="row mb-5">
            <div className="col-lg-8 mx-auto">
              <div className="bg-white p-4 rounded shadow-sm mb-4">
                <h4 className="fw-bold mb-3 text-primary">📊 The Tax Calculation Process</h4>
                <p className="mb-3">
                  UK Capital Gains Tax (CGT) is calculated on the profit you make when you sell (dispose of) shares or other assets.
                  The calculator follows HMRC rules to determine your taxable gains:
                </p>
                <ul className="mb-3">
                  <li><strong>Identify Disposals:</strong> Track when you sell shares and match them with acquisition costs</li>
                  <li><strong>Calculate Base Cost:</strong> Use purchase price, fees, and allowable costs to determine your base cost</li>
                  <li><strong>Apply Section 104 Pooling:</strong> For remaining shares, use average cost from your share pool</li>
                  <li><strong>Calculate Gain/Loss:</strong> Subtract base cost from disposal proceeds</li>
                  <li><strong>Apply Reliefs & Allowances:</strong> Subtract annual exemption (£12,300 for 2024-25)</li>
                  <li><strong>Apply Tax Rates:</strong> 10% or 20% on remaining gains (18% or 24% from Oct 2024)</li>
                </ul>
                <div className="alert alert-info border-0">
                  <small><strong>Note:</strong> The calculator processes your transaction history to apply the correct matching rules
                  (same-day, 30-day bed & breakfast, and Section 104 pooling) as required by HMRC.</small>
                </div>
              </div>
            </div>
          </div>

          <div className="row g-4">
            <div className="col-md-6 col-lg-3">
              <div className="text-center h-100">
                <div className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3 fw-bold fs-3" style={{ width: '80px', height: '80px' }}>
                  1
                </div>
                <h5 className="fw-bold mb-3">Export Your Data</h5>
                <p className="text-muted mb-3">
                  Download transaction reports from your broker (IBKR, Hargreaves Lansdown, etc.) in QFX or CSV format
                </p>
                <small className="text-muted">
                  <a href="#guide" className="text-decoration-none">📖 View detailed guides →</a>
                </small>
              </div>
            </div>

            <div className="col-md-6 col-lg-3">
              <div className="text-center h-100">
                <div className="bg-success text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3 fw-bold fs-3" style={{ width: '80px', height: '80px' }}>
                  2
                </div>
                <h5 className="fw-bold mb-3">Upload & Calculate</h5>
                <p className="text-muted mb-3">
                  Upload your file and select tax year. The calculator processes all transactions and applies HMRC rules
                </p>
                <small className="text-muted">
                  <a href="#calculator" className="text-decoration-none">🧮 Start calculation →</a>
                </small>
              </div>
            </div>

            <div className="col-md-6 col-lg-3">
              <div className="text-center h-100">
                <div className="bg-info text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3 fw-bold fs-3" style={{ width: '80px', height: '80px' }}>
                  3
                </div>
                <h5 className="fw-bold mb-3">Review Results</h5>
                <p className="text-muted mb-3">
                  Get detailed breakdown of gains, losses, tax owed, and portfolio performance analysis
                </p>
                <small className="text-muted">
                  Includes Section 104 pools and disposal matching details
                </small>
              </div>
            </div>

            <div className="col-md-6 col-lg-3">
              <div className="text-center h-100">
                <div className="bg-warning text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3 fw-bold fs-3" style={{ width: '80px', height: '80px' }}>
                  4
                </div>
                <h5 className="fw-bold mb-3">File Your Return</h5>
                <p className="text-muted mb-3">
                  Use the detailed reports to complete your Self Assessment tax return with confidence
                </p>
                <small className="text-muted">
                  Download CSV/JSON reports for your records
                </small>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What You Need Section */}
      <section className="py-5 mb-5">
        <div className="container">
          <div className="row text-center mb-5">
            <div className="col-lg-8 mx-auto">
              <h2 className="display-5 fw-bold mb-3">What Data Do You Need?</h2>
              <p className="lead text-muted">
                The calculator supports multiple formats - choose what works best for your broker
              </p>
            </div>
          </div>

          <div className="row g-4 mb-4">
            <div className="col-lg-6">
              <Card className="h-100 border-primary">
                <div className="card-header bg-primary text-white">
                  <h5 className="mb-0">
                    <i className="fas fa-file-code me-2"></i>
                    Interactive Brokers (QFX Format)
                  </h5>
                </div>
                <div className="card-body">
                  <p className="card-text">
                    Export your activity statement in Quicken (QFX) format from IBKR's Client Portal.
                    This format includes all transaction details, currency conversions, and fees.
                  </p>
                  <h6>What it contains:</h6>
                  <ul className="small mb-3">
                    <li>Buy/sell transactions with exact dates and prices</li>
                    <li>Currency conversion rates</li>
                    <li>Commission and fees</li>
                    <li>Stock splits and corporate actions</li>
                  </ul>
                  <button
                    onClick={() => window.location.hash = 'guide'}
                    className="btn btn-outline-primary btn-sm"
                  >
                    How to Export from IBKR →
                  </button>
                </div>
              </Card>
            </div>

            <div className="col-lg-6">
              <Card className="h-100 border-success">
                <div className="card-header bg-success text-white">
                  <h5 className="mb-0">
                    <i className="fas fa-file-csv me-2"></i>
                    CSV Format (Multiple Brokers)
                  </h5>
                </div>
                <div className="card-body">
                  <p className="card-text">
                    Use CSV exports from Sharesight, Hargreaves Lansdown, Fidelity, or create your own
                    CSV file following our standard format specification.
                  </p>
                  <h6>Required columns:</h6>
                  <ul className="small mb-3">
                    <li>Date, Symbol, Quantity, Price</li>
                    <li>Total Amount, Currency</li>
                    <li>Transaction Type (BUY/SELL)</li>
                    <li>Optional: Fees, Exchange Rates</li>
                  </ul>
                  <button
                    onClick={() => window.location.hash = 'guide'}
                    className="btn btn-outline-success btn-sm"
                  >
                    CSV Format Guide →
                  </button>
                </div>
              </Card>
            </div>
          </div>

          <div className="row">
            <div className="col-lg-8 mx-auto text-center">
              <div className="alert alert-light border">
                <h6 className="fw-bold mb-2">💡 Pro Tips for Better Results</h6>
                <ul className="text-start d-inline-block mb-0 small">
                  <li>Export data for complete tax years to ensure accurate calculations</li>
                  <li>Include all transactions (buys, sells, dividends, fees) for comprehensive analysis</li>
                  <li>Check for corporate actions (splits, mergers) that may affect your cost basis</li>
                  <li>Keep records of any additional costs (stamp duty, transfer fees) for manual adjustment</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Blog/Resources Section */}
      <section className="py-5 mb-5">
        <div className="container">
          <div className="row align-items-center mb-5">
            <div className="col-lg-8">
              <h2 className="display-5 fw-bold mb-3">UK Tax & Investment Blog</h2>
              <p className="lead text-muted">
                Expert insights, guides, and updates on UK tax policy and investment strategies
              </p>
            </div>
            <div className="col-lg-4 text-lg-end">
              <button 
                onClick={handleViewBlog}
                className="btn btn-outline-primary btn-lg"
              >
                View All Articles
                <i className="fas fa-arrow-right ms-2"></i>
              </button>
            </div>
          </div>
          
          <div className="row g-4">
            <div className="col-md-4">
              <Card className="h-100 border-0 shadow-sm">
                <div className="card-body">
                  <div className="badge bg-primary mb-3">Tax Guide</div>
                  <h5 className="card-title">Understanding UK Capital Gains Tax</h5>
                  <p className="card-text text-muted">
                    Complete guide to CGT calculations, allowances, and optimization strategies for 2024-25.
                  </p>
                  <button 
                    onClick={() => window.location.hash = 'blog/post/understanding-uk-capital-gains-tax'}
                    className="btn btn-sm btn-outline-primary"
                  >
                    Read More
                  </button>
                </div>
              </Card>
            </div>
            
            <div className="col-md-4">
              <Card className="h-100 border-0 shadow-sm">
                <div className="card-body">
                  <div className="badge bg-success mb-3">Strategy</div>
                  <h5 className="card-title">Tax-Efficient Investment Strategies</h5>
                  <p className="card-text text-muted">
                    Learn how to minimize your tax burden while maximizing investment returns.
                  </p>
                  <button 
                    onClick={() => window.location.hash = 'blog/post/tax-efficient-investment-strategies'}
                    className="btn btn-sm btn-outline-primary"
                  >
                    Read More
                  </button>
                </div>
              </Card>
            </div>
            
            <div className="col-md-4">
              <Card className="h-100 border-0 shadow-sm">
                <div className="card-body">
                  <div className="badge bg-info mb-3">How-To</div>
                  <h5 className="card-title">Using Interactive Brokers Data</h5>
                  <p className="card-text text-muted">
                    Step-by-step guide to extracting and processing IBKR data for UK tax calculations.
                  </p>
                  <button 
                    onClick={() => window.location.hash = 'blog/post/using-interactive-brokers-data'}
                    className="btn btn-sm btn-outline-primary"
                  >
                    Read More
                  </button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Recommended Resources Section */}
      <section className="py-5 mb-5 bg-light">
        <div className="container">
          <div className="row text-center mb-5">
            <div className="col-lg-8 mx-auto">
              <h2 className="display-5 fw-bold mb-3">Recommended Resources</h2>
              <p className="lead text-muted">
                Essential books and tools for UK investors and taxpayers
              </p>
            </div>
          </div>
          
          <AffiliateGrid
            products={featuredProducts}
            columns={{ xs: 1, sm: 3, md: 3, lg: 3, xl: 3 }}
            showRatings={true}
            showCategories={true}
            layout="vertical"
            className="justify-content-center"
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-5 text-center" style={{
        background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)'
      }}>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <h2 className="display-5 fw-bold mb-4">Ready to Calculate Your UK Taxes?</h2>
              <p className="lead text-muted mb-4">
                Join thousands of UK investors who trust our platform for accurate tax calculations
              </p>
              <div className="d-flex gap-3 justify-content-center flex-wrap">
                <button 
                  onClick={handleGetStarted}
                  className="btn btn-primary btn-lg px-5 py-3"
                >
                  <i className="fas fa-calculator me-2"></i>
                  Start Free Calculation
                </button>
                <button 
                  onClick={handleViewBlog}
                  className="btn btn-outline-primary btn-lg px-5 py-3"
                >
                  <i className="fas fa-book-open me-2"></i>
                  Read Our Guides
                </button>
              </div>
              
              <div className="mt-4 small text-muted">
                <i className="fas fa-lock me-1"></i>
                Your data is processed securely and never stored permanently
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEO Content Section (Hidden but crawlable) */}
      <section className="d-none">
        <h3>UK Tax Calculator for Interactive Brokers Users</h3>
        <p>
          Calculate capital gains tax, dividend tax, and currency gains for UK investors using Interactive Brokers. 
          Our HMRC-compliant calculator processes IBKR activity statements to generate accurate tax calculations 
          for your Self Assessment return.
        </p>
        
        <h4>Features:</h4>
        <ul>
          <li>Capital Gains Tax calculation with Section 104 pooling</li>
          <li>Dividend income tax calculation</li>
          <li>Currency gain/loss calculation</li>
          <li>Portfolio performance analysis</li>
          <li>HMRC-ready reports</li>
          <li>Support for stocks, ETFs, and other securities</li>
        </ul>
        
        <h4>Keywords:</h4>
        <p>
          UK tax calculator, Interactive Brokers tax, IBKR tax, capital gains tax calculator, 
          dividend tax calculator, CGT calculator, HMRC compliance, UK investment tax, 
          Section 104 pooling, Self Assessment, tax return, portfolio analysis
        </p>
      </section>
    </div>
  );
};

export default LandingPage;
