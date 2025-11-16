import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AffiliateGrid from '../components/affiliate/AffiliateGrid';
import { AffiliateProduct } from '../types/affiliate';
import affiliateProductsData from '../data/affiliateProducts.json';

type FeatureCard = {
  icon: string;
  iconVariant: string;
  title: string;
  description: string;
};

type BlogArticle = {
  badge: string;
  badgeVariant: string;
  title: string;
  description: string;
};

type TaxStrategy = {
  title: string;
  description: string;
  highlight?: string;
};

type FaqItem = {
  id: string;
  question: string;
  answer: React.ReactNode;
  expanded?: boolean;
};

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const featuredProducts = useMemo(() => {
    return affiliateProductsData.products
      .filter(product => product.featured)
      .slice(0, 6)
      .map(product => ({
        ...product,
        fallbackImageUrl: (product as AffiliateProduct & { fallbackImageUrl?: string }).fallbackImageUrl || '/images/book-placeholder.jpg'
      })) as AffiliateProduct[];
  }, []);

  const featureCards: FeatureCard[] = useMemo(
    () => [
      {
        icon: 'fas fa-calculator fa-xl',
        iconVariant: 'bg-primary',
        title: 'HMRC Compliant',
        description: 'Accurate UK tax calculations following HMRC guidelines for capital gains, dividends, and currency gains.'
      },
      {
        icon: 'fas fa-chart-line fa-xl',
        iconVariant: 'bg-success',
        title: 'Portfolio Analytics',
        description: 'Comprehensive portfolio analysis with performance metrics, market breakdown, and current holdings.'
      },
      {
        icon: 'fas fa-file-alt fa-xl',
        iconVariant: 'bg-info',
        title: 'Detailed Reports',
        description: 'Generate comprehensive reports in multiple formats for tax filing and portfolio review.'
      }
    ],
    []
  );

  const blogArticles: BlogArticle[] = useMemo(
    () => [
      {
        badge: 'Tax Guide',
        badgeVariant: 'bg-primary',
        title: 'Understanding UK Capital Gains Tax',
        description: 'Complete guide to CGT calculations, allowances, and optimisation strategies for 2024-25.'
      },
      {
        badge: 'Strategy',
        badgeVariant: 'bg-success',
        title: 'Tax-Efficient Investment Strategies',
        description: 'Learn how to minimise your tax burden while maximising investment returns.'
      },
      {
        badge: 'How-To',
        badgeVariant: 'bg-info',
        title: 'Using Interactive Brokers Data',
        description: 'Step-by-step guide to extracting and processing IBKR data for UK tax calculations.'
      }
    ],
    []
  );

  const taxStrategies: TaxStrategy[] = useMemo(
    () => [
      {
        title: 'Timing Your Disposals',
        description:
          'Strategic timing of share sales can significantly impact your tax liability. Consider spreading large disposals across tax years to make use of multiple annual exemptions.',
        highlight:
          'Example: Selling £3,000 in March and £7,000 in April can utilise two annual exemptions.'
      },
      {
        title: 'Harvesting Tax Losses',
        description:
          'Realising losses to offset gains is a powerful tax strategy. Sell losing positions to crystallise losses, then repurchase after 30 days to avoid the bed and breakfast rule.',
        highlight: 'Losses must be realised in the same tax year to offset current gains.'
      },
      {
        title: 'ISA and SIPP Utilisation',
        description:
          'Maximise your ISA allowance (£20,000 for 2024-25) and pension contributions to shelter investments from capital gains tax.',
        highlight:
          'Be mindful of 30-day rules when moving between taxable accounts and wrappers.'
      },
      {
        title: 'Spouse & Civil Partner Transfers',
        description:
          'Transfers between spouses or civil partners are generally tax-free and can optimise the use of both partners’ allowances and tax bands.',
        highlight:
          'Transfer assets to the lower-rate taxpayer before disposal to benefit from lower CGT rates.'
      }
    ],
    []
  );

  const faqItems: FaqItem[] = useMemo(
    () => [
      {
        id: 'formats',
        question: 'What file formats does the calculator accept?',
        expanded: true,
        answer: (
          <>
            <p>
              The calculator accepts both QFX (Quicken Financial Exchange) and CSV exports. QFX files include the most
              detailed transaction information and are recommended when available.
            </p>
            <p className="mb-2">
              <strong>To export from IBKR:</strong>
            </p>
            <ol className="mb-0 ps-3">
              <li>Log in to the IBKR Client Portal</li>
              <li>Open Reports → Statements → Activity</li>
              <li>Select the required tax year and Quicken (QFX) format</li>
              <li>Download the statement and upload it directly to the calculator</li>
            </ol>
          </>
        )
      },
      {
        id: 'accuracy',
        question: 'How accurate are the tax calculations?',
        answer: (
          <>
            <p>
              The calculations follow HMRC rules including Section 104 pooling, same-day and 30-day matching, and official
              historical exchange rates.
            </p>
            <ul className="mb-0">
              <li>Section 104 pooling for share matching</li>
              <li>Historical HMRC exchange rates for currency conversion</li>
              <li>Dividend withholding tax handling</li>
              <li>Current tax rates and allowances for each tax year</li>
            </ul>
          </>
        )
      },
      {
        id: 'privacy',
        question: 'What about data privacy and security?',
        answer: (
          <>
            <p>
              Uploaded files are processed securely and never stored. All communication is encrypted and the service runs
              in isolated, serverless infrastructure.
            </p>
            <ul className="mb-0">
              <li>HTTPS encryption for all traffic</li>
              <li>No persistent storage of uploaded files</li>
              <li>Automatic deletion after processing</li>
              <li>No sharing of data with third parties</li>
            </ul>
          </>
        )
      },
      {
        id: 'reporting',
        question: 'Do I need to report small gains to HMRC?',
        answer: (
          <>
            <p>
              You must report if your total gains exceed the annual exempt amount (£3,000 for 2024-25) or if your disposal
              proceeds exceed £12,000.
            </p>
            <p className="mb-0">
              Dividend income above £500 must also be reported even if no capital gains tax is due.
            </p>
          </>
        )
      },
      {
        id: 'currency',
        question: 'How does currency conversion work?',
        answer: (
          <>
            <p>
              All transactions are converted to GBP using HMRC exchange rates for the transaction date. This includes
              purchases, sales, dividends, fees, and commissions.
            </p>
            <p className="mb-0">
              Average rates are not used; each transaction is converted at its specific rate to comply with HMRC
              requirements.
            </p>
          </>
        )
      },
      {
        id: 'losses',
        question: 'What if I have losses from previous years?',
        answer: (
          <>
            <p>
              Losses can be carried forward indefinitely but must be claimed within four years. Current year losses are used
              first, followed by the annual exemption and then historic losses.
            </p>
            <p className="mb-0">
              Use the calculator output to adjust your Self Assessment submission with any brought-forward losses.
            </p>
          </>
        )
      }
    ],
    []
  );

  const handleGetStarted = () => navigate('/calculator');
  const handleViewGuide = () => navigate('/guide');
  const handleViewBlog = () => navigate('/blog');
  const handleViewHelp = () => navigate('/help');
  const handleViewAbout = () => navigate('/about');

  return (
    <div className="landing-page">
      <section id="calculator" className="hero-section py-5 mb-5 position-relative overflow-hidden text-white">
        <div className="container">
          <div className="row align-items-center min-vh-75">
            <div className="col-lg-7">
              <h1 className="display-3 fw-bold mb-4">
                UK Tax Calculator for
                <span className="d-block text-warning">Interactive Brokers</span>
              </h1>
              <p className="lead mb-4 fs-5">
                Calculate your UK capital gains tax, dividend income, and portfolio performance from IBKR transactions.
                HMRC compliant calculations with detailed reporting.
              </p>
              <div className="d-flex gap-3 mb-4 flex-wrap">
                <button onClick={handleGetStarted} className="btn btn-light btn-lg px-4 py-3 fw-semibold">
                  <i className="fas fa-calculator me-2" />
                  Start Calculation
                </button>
                <button onClick={handleViewGuide} className="btn btn-outline-light btn-lg px-4 py-3">
                  <i className="fas fa-book me-2" />
                  CGT Guide
                </button>
              </div>
              <div className="d-flex gap-4 text-light small opacity-90 flex-wrap">
                <div className="d-flex align-items-center">
                  <i className="fas fa-shield-alt me-2" />
                  HMRC Compliant
                </div>
                <div className="d-flex align-items-center">
                  <i className="fas fa-users me-2" />
                  10k+ Users
                </div>
                <div className="d-flex align-items-center">
                  <i className="fas fa-star me-2" />
                  Free to Use
                </div>
              </div>
            </div>
            <div className="col-lg-5 d-none d-lg-block">
              <div className="ad-container hero-ad-slot w-100 h-100" aria-hidden="true">
                {/* Google Auto Ads will automatically populate this area */}
              </div>
            </div>
          </div>
        </div>
        <div
          className="hero-background-pattern position-absolute top-0 start-0 w-100 h-100"
          aria-hidden="true"
        />
      </section>

      <div className="container-xxl mb-5">
        <div className="row gx-4">
          <aside className="col-xl-2 d-none d-xl-block">
            <div className="ad-column start-ad-slot" aria-hidden="true" />
          </aside>

          <div className="col-xl-8">
            <section className="py-5" aria-labelledby="feature-heading">
              <div className="container">
                <div className="row text-center mb-5">
                  <div className="col-lg-8 mx-auto">
                    <h2 id="feature-heading" className="display-5 fw-bold mb-3">
                      Why Choose Our Tax Calculator?
                    </h2>
                    <p className="lead text-muted">
                      Comprehensive UK tax calculations designed specifically for Interactive Brokers users.
                    </p>
                  </div>
                </div>
                <div className="row g-4">
                  {featureCards.map(card => (
                    <div className="col-md-4" key={card.title}>
                      <div className="card feature-card h-100 border-0 shadow-sm text-center p-4">
                        <div
                          className={`${card.iconVariant} text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3 feature-icon`}
                        >
                          <i className={card.icon} aria-hidden="true" />
                        </div>
                        <h5 className="card-title fw-bold mb-3">{card.title}</h5>
                        <p className="card-text text-muted">{card.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section id="about" className="py-5 mobile-bg-light">
              <div className="container">
                <div className="row text-center mb-5">
                  <div className="col-lg-10 mx-auto">
                    <h2 className="display-5 fw-bold mb-3">How UK Capital Gains Tax Calculation Works</h2>
                    <p className="lead text-muted">
                      Understanding the process helps you prepare accurate data and interpret the output with confidence.
                    </p>
                  </div>
                </div>
                <div className="row justify-content-center mb-5">
                  <div className="col-lg-9">
                    <div className="bg-white p-4 p-lg-5 rounded shadow-sm">
                      <h4 className="fw-bold mb-3 text-primary">
                        The HMRC-compliant Calculation Pipeline
                      </h4>
                      <p className="mb-3">
                        The calculator follows HMRC requirements to evaluate your trading activity, match disposals, and apply
                        current rates:
                      </p>
                      <ul className="mb-3">
                        <li>Identify disposals and acquisition pairs for every security</li>
                        <li>Apply same-day and 30-day matching before Section 104 pooling</li>
                        <li>Reconstruct allowable costs including fees and commissions</li>
                        <li>Convert every amount to GBP with HMRC daily exchange rates</li>
                        <li>Apply the annual exempt amount and current CGT brackets</li>
                      </ul>
                      <div className="alert alert-info border-0">
                        <small>
                          The SPA mirrors the proven static implementation so you receive the same detailed disposal,
                          portfolio, and dividend reporting in a rich, responsive interface.
                        </small>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="row g-4 justify-content-center">
                  {['Export Your Data', 'Upload & Calculate', 'Review Results', 'File Your Return'].map((step, index) => (
                    <div className="col-12 col-sm-6 col-lg-3" key={step}>
                      <div className="text-center p-4 bg-white rounded shadow-sm h-100">
                        <div
                          className="step-number text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                          aria-hidden="true"
                        >
                          {index + 1}
                        </div>
                        <h5 className="fw-bold mb-3">{step}</h5>
                        <p className="text-muted mb-3">
                          {index === 0 && 'Download transaction reports from IBKR or compatible brokers in QFX or CSV format.'}
                          {index === 1 && 'Upload your file, pick the tax year, and let the engine handle HMRC matching rules.'}
                          {index === 2 && 'Inspect detailed breakdowns covering gains, losses, pools, dividends, and portfolio analytics.'}
                          {index === 3 && 'Use the structured output to complete your Self Assessment with supporting evidence.'}
                        </p>
                        {index === 0 && (
                          <button onClick={handleViewGuide} className="btn btn-link p-0 text-decoration-none">
                            View export guide →
                          </button>
                        )}
                        {index === 1 && (
                          <button onClick={handleGetStarted} className="btn btn-link p-0 text-decoration-none">
                            Upload now →
                          </button>
                        )}
                        {index === 2 && (
                          <button onClick={handleViewHelp} className="btn btn-link p-0 text-decoration-none">
                            Review sample results →
                          </button>
                        )}
                        {index === 3 && (
                          <button onClick={handleViewGuide} className="btn btn-link p-0 text-decoration-none">
                            Read CGT filing checklist →
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section id="guide" className="py-5">
              <div className="container">
                <div className="row text-center mb-5">
                  <div className="col-lg-8 mx-auto">
                    <h2 className="display-5 fw-bold mb-3">What Data Do You Need?</h2>
                    <p className="lead text-muted">
                      Upload complete tax-year statements to ensure accurate calculations across all disposals and dividends.
                    </p>
                  </div>
                </div>
                <div className="row g-4 mb-4">
                  <div className="col-lg-6">
                    <div className="card border-primary h-100">
                      <div className="card-header bg-primary text-white">
                        <h5 className="mb-0">
                          <i className="fas fa-file-code me-2" aria-hidden="true" />
                          Interactive Brokers (QFX)
                        </h5>
                      </div>
                      <div className="card-body">
                        <p>
                          Export your IBKR Activity Statement in Quicken (QFX) format for the richest transaction detail, including
                          corporate actions and currency conversions.
                        </p>
                        <h6>Included data:</h6>
                        <ul>
                          <li>Buy/sell trades with execution details</li>
                          <li>Currency conversions and FX rates</li>
                          <li>Commission, fees, and taxes</li>
                          <li>Corporate actions and adjustments</li>
                        </ul>
                        <button onClick={handleViewGuide} className="btn btn-outline-primary btn-sm">
                          How to export →
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-6">
                    <div className="card border-success h-100">
                      <div className="card-header bg-success text-white">
                        <h5 className="mb-0">
                          <i className="fas fa-file-csv me-2" aria-hidden="true" />
                          CSV Format (Multi-Broker)
                        </h5>
                      </div>
                      <div className="card-body">
                        <p>
                          Use CSV exports from brokers such as Sharesight, Hargreaves Lansdown, Fidelity, or generate files that match
                          the documented column specification.
                        </p>
                        <h6>Required columns:</h6>
                        <ul>
                          <li>Date, Symbol, Quantity, Price, and Total Amount</li>
                          <li>Transaction Type (BUY/SELL)</li>
                          <li>Currency and FX rates where applicable</li>
                          <li>Optional: Fees, commissions, and withholding taxes</li>
                        </ul>
                        <button onClick={handleViewGuide} className="btn btn-outline-success btn-sm">
                          View CSV format →
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="row">
                  <div className="col-lg-10 mx-auto">
                    <div className="alert alert-light border">
                      <h6 className="fw-bold mb-2">Pro tips for accurate results</h6>
                      <ul className="mb-0">
                        <li>Cover the full tax year (6 April – 5 April) to capture all disposals and dividends.</li>
                        <li>Ensure all corporate actions are included to keep Section 104 pools consistent.</li>
                        <li>Keep supporting evidence for additional costs such as stamp duty or transfer fees.</li>
                        <li>Use GBP exchange rates supplied in your statement or by HMRC for the relevant dates.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section id="blog" className="py-5">
              <div className="container">
                <div className="row align-items-center mb-5">
                  <div className="col-lg-8">
                    <h2 className="display-5 fw-bold mb-3">UK Tax & Investment Blog</h2>
                    <p className="lead text-muted">
                      Expert insights, guides, and updates on UK policy changes affecting international investors.
                    </p>
                  </div>
                  <div className="col-lg-4 text-lg-end">
                    <button onClick={handleViewBlog} className="btn btn-outline-primary btn-lg">
                      View all articles
                      <i className="fas fa-arrow-right ms-2" aria-hidden="true" />
                    </button>
                  </div>
                </div>
                <div className="row g-4">
                  <div className="col-12">
                    <div className="alert alert-warning border-warning d-flex align-items-start">
                      <i className="fas fa-exclamation-triangle fa-2x text-warning me-3 mt-1" aria-hidden="true" />
                      <div>
                        <h4 className="alert-heading mb-3">Urgent: CGT Rate Changes (from 30 October 2024)</h4>
                        <p className="mb-3">
                          Capital gains tax rates for shares and ETFs have increased significantly. Basic rate taxpayers now pay
                          18% (+8%) and higher rate taxpayers 24% (+4%) on disposals made after 30 October 2024.
                        </p>
                        <div className="row mb-3">
                          <div className="col-md-6">
                            <strong>Before 30 Oct 2024:</strong>
                            <br />
                            Basic rate 10% • Higher rate 20%
                          </div>
                          <div className="col-md-6">
                            <strong>From 30 Oct 2024:</strong>
                            <br />
                            Basic rate 18% • Higher rate 24%
                          </div>
                        </div>
                        <button onClick={handleViewGuide} className="btn btn-warning btn-sm">
                          Read full CGT guide
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="row g-4">
                  {blogArticles.map(article => (
                    <div className="col-md-4" key={article.title}>
                      <div className="card h-100 border-0 shadow-sm">
                        <div className="card-body">
                          <span className={`badge ${article.badgeVariant} mb-3`}>{article.badge}</span>
                          <h5 className="card-title">{article.title}</h5>
                          <p className="card-text text-muted">{article.description}</p>
                          <button onClick={handleViewBlog} className="btn btn-sm btn-outline-primary">
                            Read more
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section id="help" className="py-5 bg-light">
              <div className="container">
                <div className="row">
                  <div className="col-lg-10 mx-auto">
                    <h2 className="text-center mb-5">Frequently Asked Questions</h2>
                    <div className="accordion" id="faqAccordion">
                      {faqItems.map(item => (
                        <div className="accordion-item" key={item.id}>
                          <h3 className="accordion-header" id={`faq-heading-${item.id}`}>
                            <button
                              className={`accordion-button ${item.expanded ? '' : 'collapsed'}`}
                              type="button"
                              data-bs-toggle="collapse"
                              data-bs-target={`#faq-collapse-${item.id}`}
                              aria-expanded={item.expanded}
                              aria-controls={`faq-collapse-${item.id}`}
                            >
                              {item.question}
                            </button>
                          </h3>
                          <div
                            id={`faq-collapse-${item.id}`}
                            className={`accordion-collapse collapse ${item.expanded ? 'show' : ''}`}
                            aria-labelledby={`faq-heading-${item.id}`}
                            data-bs-parent="#faqAccordion"
                          >
                            <div className="accordion-body">{item.answer}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="py-5">
              <div className="container">
                <h2 className="text-center mb-5">Tax Planning Strategies for International Investors</h2>
                <div className="row g-4">
                  {taxStrategies.map(strategy => (
                    <div className="col-md-6" key={strategy.title}>
                      <div className="card h-100 border-0 shadow-sm">
                        <div className="card-body">
                          <h4 className="card-title text-primary">{strategy.title}</h4>
                          <p className="card-text">{strategy.description}</p>
                          {strategy.highlight && (
                            <p className="card-text">
                              <strong>{strategy.highlight}</strong>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="py-5 bg-light">
              <div className="container">
                <div className="row">
                  <div className="col-lg-10 mx-auto text-center">
                    <h2 className="display-5 fw-bold mb-4">Recommended Resources</h2>
                    <p className="lead text-muted mb-5">
                      Essential books and tools that help UK investors stay informed and tax-efficient.
                    </p>
                    <AffiliateGrid
                      products={featuredProducts}
                      columns={{ xs: 1, sm: 2, md: 3, lg: 3, xl: 3 }}
                      showRatings
                      showCategories
                      layout="vertical"
                      className="justify-content-center"
                    />
                  </div>
                </div>
              </div>
            </section>

            <section className="py-5 text-center cta-section">
              <div className="container">
                <div className="row justify-content-center">
                  <div className="col-lg-8">
                    <h2 className="display-5 fw-bold mb-4 text-white">Ready to Calculate Your UK Taxes?</h2>
                    <p className="lead text-white-50 mb-4">
                      Join thousands of UK investors who trust this platform for accurate HMRC-compliant tax calculations.
                    </p>
                    <div className="d-flex gap-3 justify-content-center flex-wrap">
                      <button onClick={handleGetStarted} className="btn btn-light btn-lg px-5 py-3">
                        <i className="fas fa-calculator me-2" aria-hidden="true" />
                        Start Free Calculation
                      </button>
                      <button onClick={handleViewBlog} className="btn btn-outline-light btn-lg px-5 py-3">
                        <i className="fas fa-book-open me-2" aria-hidden="true" />
                        Read Our Guides
                      </button>
                    </div>
                    <div className="mt-4 small text-white-50">
                      <i className="fas fa-lock me-1" aria-hidden="true" />
                      Your files are processed securely and never stored.
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="d-none">
              <h3>UK Tax Calculator for Interactive Brokers Users</h3>
              <p>
                Calculate capital gains tax, dividend tax, and currency gains for UK investors using Interactive Brokers.
                The SPA replicates the production landing page so HMRC-compliant outputs remain consistent across web experiences.
              </p>
              <ul>
                <li>Capital gains tax calculation with Section 104 pooling</li>
                <li>Dividend income tax calculation with withholding adjustments</li>
                <li>Currency gain/loss calculation using HMRC exchange rates</li>
                <li>Portfolio performance analysis and reporting</li>
                <li>Support for stocks, ETFs, and other securities</li>
              </ul>
              <p>
                Keywords: UK tax calculator, Interactive Brokers tax, IBKR CGT, capital gains tax calculator, HMRC compliance,
                Section 104 pooling, UK investment tax, Self Assessment, portfolio analytics.
              </p>
            </section>
          </div>

          <aside className="col-xl-2 d-none d-xl-block">
            <div className="ad-column end-ad-slot" aria-hidden="true" />
          </aside>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
