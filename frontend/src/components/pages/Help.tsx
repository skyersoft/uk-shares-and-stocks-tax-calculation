import React, { useState } from 'react';

export interface HelpProps {
  className?: string;
}

interface HelpArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
}

const helpArticles: HelpArticle[] = [
  {
    id: 'upload-files',
    title: 'How do I upload my transaction files?',
    content: 'Drag and drop your files into the upload area, or click to browse and select your QFX, CSV, or other supported files.',
    category: 'getting-started',
    tags: ['upload', 'files', 'drag-drop']
  },
  {
    id: 'supported-formats',
    title: 'What file formats are supported?',
    content: 'We support QFX files from Interactive Brokers, CSV exports from various platforms, and manual transaction entry.',
    category: 'file-formats',
    tags: ['qfx', 'csv', 'formats']
  },
  {
    id: 'tax-calculation',
    title: 'How are tax calculations performed?',
    content: 'We follow HMRC Section 104 pooling rules and same-day/bed-and-breakfast matching as specified in the Capital Gains Manual.',
    category: 'tax-calculations',
    tags: ['tax', 'section-104', 'hmrc']
  },
  {
    id: 'upload-problems',
    title: 'File upload problems',
    content: 'If you cannot upload files, check the file format is supported and the file size is under 10MB.',
    category: 'troubleshooting',
    tags: ['upload', 'problems', 'file-size']
  },
  {
    id: 'calculation-errors',
    title: 'Calculation errors',
    content: 'Ensure your transaction data is complete and dates are in the correct format. Check for missing acquisition costs.',
    category: 'troubleshooting',
    tags: ['calculation', 'errors', 'data']
  }
];

export const Help: React.FC<HelpProps> = ({ className = '' }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredArticles = helpArticles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const categories = [
    { id: 'all', name: 'All Topics' },
    { id: 'getting-started', name: 'Getting Started' },
    { id: 'file-formats', name: 'File Formats' },
    { id: 'tax-calculations', name: 'Tax Calculations' },
    { id: 'troubleshooting', name: 'Troubleshooting' }
  ];

  return (
    <div className={`help-page ${className}`}>
      {/* Hero Section */}
      <section className="hero-section bg-primary text-white py-5">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-8">
              <h1 className="display-4 fw-bold mb-4">Help & Support</h1>
              <p className="lead mb-4">
                Find answers to common questions and get help with using the IBKR Tax Calculator.
              </p>
            </div>
            <div className="col-lg-4 text-center">
              <i className="bi bi-question-circle" style={{ fontSize: '6rem', opacity: 0.8 }}></i>
            </div>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="search-section py-4 bg-light">
        <div className="container">
          <div className="row">
            <div className="col-lg-8 mx-auto">
              <div className="input-group input-group-lg">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search help articles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button className="btn btn-primary" type="button">
                  <i className="bi bi-search me-2"></i>
                  Search
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container py-5">
        <div className="row">
          {/* Sidebar */}
          <div className="col-lg-3 mb-4">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">Categories</h5>
              </div>
              <div className="card-body p-0">
                <div className="list-group list-group-flush">
                  {categories.map(category => (
                    <button
                      key={category.id}
                      className={`list-group-item list-group-item-action ${
                        selectedCategory === category.id ? 'active' : ''
                      }`}
                      onClick={() => setSelectedCategory(category.id)}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="card mt-4">
              <div className="card-header">
                <h5 className="mb-0">Quick Links</h5>
              </div>
              <div className="card-body">
                <div className="d-grid gap-2">
                  <a href="/" className="btn btn-outline-primary btn-sm">
                    <i className="bi bi-calculator me-2"></i>
                    Calculator
                  </a>
                  <a href="/about" className="btn btn-outline-primary btn-sm">
                    <i className="bi bi-info-circle me-2"></i>
                    About
                  </a>
                  <a href="/privacy" className="btn btn-outline-primary btn-sm">
                    <i className="bi bi-shield-check me-2"></i>
                    Privacy Policy
                  </a>
                  <a href="/terms" className="btn btn-outline-primary btn-sm">
                    <i className="bi bi-file-text me-2"></i>
                    Terms of Service
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="col-lg-9">
            {/* FAQ Section */}
            <section className="faq-section mb-5">
              <h2 className="mb-4">Frequently Asked Questions</h2>
              <div className="accordion" id="faqAccordion">
                {filteredArticles.map((article, index) => (
                  <div key={article.id} className="accordion-item">
                    <h3 className="accordion-header">
                      <button
                        className={`accordion-button ${index !== 0 ? 'collapsed' : ''}`}
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target={`#faq${article.id}`}
                        aria-expanded={index === 0}
                      >
                        {article.title}
                      </button>
                    </h3>
                    <div
                      id={`faq${article.id}`}
                      className={`accordion-collapse collapse ${index === 0 ? 'show' : ''}`}
                      data-bs-parent="#faqAccordion"
                    >
                      <div className="accordion-body">
                        {article.content}
                        <div className="mt-2">
                          {article.tags.map(tag => (
                            <span key={tag} className="badge bg-secondary me-1">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredArticles.length === 0 && (
                <div className="text-center py-5">
                  <i className="bi bi-search text-muted" style={{ fontSize: '3rem' }}></i>
                  <h4 className="text-muted mt-3">No articles found</h4>
                  <p className="text-muted">Try adjusting your search terms or category selection.</p>
                </div>
              )}
            </section>

            {/* Common Issues */}
            <section className="common-issues-section mb-5">
              <h2 className="mb-4">Common Issues</h2>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <div className="card h-100">
                    <div className="card-body">
                      <h5 className="card-title">
                        <i className="bi bi-upload text-warning me-2"></i>
                        File Upload Problems
                      </h5>
                      <p className="card-text">
                        Issues with uploading QFX files or CSV exports from your broker.
                      </p>
                      <ul className="list-unstyled">
                        <li>• Check file format is supported</li>
                        <li>• Ensure file size is under 10MB</li>
                        <li>• Verify file is not corrupted</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="col-md-6 mb-3">
                  <div className="card h-100">
                    <div className="card-body">
                      <h5 className="card-title">
                        <i className="bi bi-exclamation-triangle text-danger me-2"></i>
                        Calculation Errors
                      </h5>
                      <p className="card-text">
                        When tax calculations seem incorrect or show unexpected results.
                      </p>
                      <ul className="list-unstyled">
                        <li>• Verify all transactions are included</li>
                        <li>• Check date formats are correct</li>
                        <li>• Ensure acquisition costs are present</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Contact Support */}
            <section className="contact-support-section">
              <div className="card bg-light">
                <div className="card-body text-center">
                  <h2 className="mb-4">Contact Support</h2>
                  <p className="mb-4">
                    Still need help? Our support team is here to assist you.
                  </p>
                  <div className="d-flex justify-content-center gap-3">
                    <a 
                      href="mailto:support@ibkr-tax-calculator.com" 
                      className="btn btn-primary"
                    >
                      <i className="bi bi-envelope me-2"></i>
                      Email Support
                    </a>
                    <a 
                      href="/about" 
                      className="btn btn-outline-primary"
                    >
                      <i className="bi bi-info-circle me-2"></i>
                      Learn More
                    </a>
                  </div>
                </div>
              </div>
            </section>

            {/* System Information */}
            <section className="system-info-section mt-5">
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0">System Information</h5>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-6">
                      <p><strong>Version:</strong> 1.0.0</p>
                      <p><strong>Last Updated:</strong> September 2024</p>
                    </div>
                    <div className="col-md-6">
                      <p><strong>Browser:</strong> {navigator.userAgent.split(' ')[0]}</p>
                      <p><strong>Platform:</strong> {navigator.platform}</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Help;