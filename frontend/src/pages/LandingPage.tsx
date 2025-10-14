import React from 'react';
import { Card } from '../components/ui/Card';
import AffiliateGrid from '../components/affiliate/AffiliateGrid';

const LandingPage: React.FC = () => {
  const handleGetStarted = () => {
    window.location.hash = 'calculator';
  };

  const handleViewBlog = () => {
    window.location.hash = 'blog';
  };

  const handleViewGuide = () => {
    window.location.hash = 'guide';
  };

  // Featured affiliate products for landing page
  const featuredProducts = [
    {
      id: 'taxtopia-book',
      title: 'Taxtopia: How I Fell in Love with Tax',
      description: 'Essential reading for UK taxpayers - learn how the tax system really works',
      asin: 'B01MXDQ6Q7',
      price: '£8.99',
      rating: 4.5,
      category: 'tax' as const,
      tags: ['tax', 'education', 'uk'],
      affiliateUrl: 'https://amzn.to/3HxSIlP',
      imageUrl: '/api/placeholder/200/280'
    },
    {
      id: 'interactive-brokers-guide',
      title: 'The Complete Guide to Interactive Brokers',
      description: 'Master IBKR platform for UK investors with tax-efficient strategies',
      asin: 'B08XQJK2N1',
      price: '£12.99',
      rating: 4.7,
      category: 'trading' as const,
      tags: ['ibkr', 'trading', 'investment'],
      affiliateUrl: 'https://amzn.to/4myUMZI',
      imageUrl: '/api/placeholder/200/280'
    },
    {
      id: 'tax-free-income',
      title: 'Tax-Free Income for Life',
      description: 'Proven strategies to minimize your UK tax burden legally',
      asin: 'B07QG8K3N2',
      price: '£9.99',
      rating: 4.6,
      category: 'tax' as const,
      tags: ['tax', 'strategy', 'planning'],
      affiliateUrl: 'https://amzn.to/3YvW2tX',
      imageUrl: '/api/placeholder/200/280'
    }
  ];

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
            backgroundRepeat: 'repeat'
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

      {/* How It Works Section */}
      <section className="py-5 mb-5 bg-light">
        <div className="container">
          <div className="row text-center mb-5">
            <div className="col-lg-8 mx-auto">
              <h2 className="display-5 fw-bold mb-3">How It Works</h2>
              <p className="lead text-muted">
                Get your tax calculations done in 3 simple steps
              </p>
            </div>
          </div>
          
          <div className="row g-4">
            <div className="col-md-4">
              <div className="text-center">
                <div className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3 fw-bold fs-3" style={{ width: '80px', height: '80px' }}>
                  1
                </div>
                <h5 className="fw-bold mb-3">Upload Your Data</h5>
                <p className="text-muted">
                  Upload your IBKR activity statement or manually enter transaction data
                </p>
              </div>
            </div>
            
            <div className="col-md-4">
              <div className="text-center">
                <div className="bg-success text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3 fw-bold fs-3" style={{ width: '80px', height: '80px' }}>
                  2
                </div>
                <h5 className="fw-bold mb-3">Automatic Calculation</h5>
                <p className="text-muted">
                  Our system automatically calculates CGT, dividend tax, and currency gains
                </p>
              </div>
            </div>
            
            <div className="col-md-4">
              <div className="text-center">
                <div className="bg-info text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3 fw-bold fs-3" style={{ width: '80px', height: '80px' }}>
                  3
                </div>
                <h5 className="fw-bold mb-3">Get Your Report</h5>
                <p className="text-muted">
                  Download comprehensive reports ready for HMRC submission
                </p>
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
            columns={{ xs: 1, sm: 2, md: 3 }}
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