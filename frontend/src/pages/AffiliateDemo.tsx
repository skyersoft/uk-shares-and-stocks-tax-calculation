/**
 * Affiliate Demo Page
 * Demonstrates all affiliate marketing components with real product data
 */

import React, { useState } from 'react';
import {
  AffiliateLink,
  AffiliateCard,
  AffiliateGrid,
  AffiliateDisclosure,
  getAllAffiliateProducts,
  getAffiliateProductsByCategory,
  getFeaturedAffiliateProducts
} from '../components/affiliate';
import '../components/affiliate/affiliate.css';

const AffiliateDemo: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [layout, setLayout] = useState<'vertical' | 'horizontal'>('vertical');

  const allProducts = getAllAffiliateProducts();
  const featuredProducts = getFeaturedAffiliateProducts();

  return (
    <div className="container my-5">
      <div className="row">
        <div className="col-12">
          {/* Header */}
          <div className="text-center mb-5">
            <h1 className="display-4 mb-3">Affiliate Components Demo</h1>
            <p className="lead text-muted">
              Comprehensive Amazon affiliate marketing system for tax and trading books
            </p>
            
            {/* Banner Disclosure */}
            <AffiliateDisclosure style="banner" />
          </div>

          {/* Demo Controls */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="card-title mb-0">
                <i className="bi bi-gear me-2"></i>
                Demo Controls
              </h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-4">
                  <label htmlFor="categorySelect" className="form-label">Category Filter</label>
                  <select
                    id="categorySelect"
                    className="form-select"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    <option value="all">All Categories</option>
                    <option value="tax">Tax Guides</option>
                    <option value="trading">Trading Psychology</option>
                    <option value="finance">Finance & Investment</option>
                    <option value="business">Business & Entrepreneurship</option>
                  </select>
                </div>
                <div className="col-md-4">
                  <label htmlFor="searchInput" className="form-label">Search Products</label>
                  <input
                    id="searchInput"
                    type="text"
                    className="form-control"
                    placeholder="Search by title, author, or tags..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="col-md-4">
                  <label htmlFor="layoutSelect" className="form-label">Card Layout</label>
                  <select
                    id="layoutSelect"
                    className="form-select"
                    value={layout}
                    onChange={(e) => setLayout(e.target.value as 'vertical' | 'horizontal')}
                  >
                    <option value="vertical">Vertical Cards</option>
                    <option value="horizontal">Horizontal Cards</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Individual Component Demos */}
          <div className="row mb-5">
            {/* AffiliateLink Demo */}
            <div className="col-lg-6 mb-4">
              <div className="card h-100">
                <div className="card-header">
                  <h5 className="card-title mb-0">
                    <i className="bi bi-link-45deg me-2"></i>
                    AffiliateLink Component
                  </h5>
                </div>
                <div className="card-body">
                  <p className="text-muted">Simple affiliate links with tracking and FTC compliance:</p>
                  <div className="d-flex flex-column gap-2">
                    <div>
                      <strong>Default Link:</strong><br />
                      <AffiliateLink product={allProducts[0]} />
                    </div>
                    <div>
                      <strong>Button Style:</strong><br />
                      <AffiliateLink product={allProducts[0]} className="btn btn-primary">
                        <i className="bi bi-cart3 me-2"></i>
                        Buy on Amazon
                      </AffiliateLink>
                    </div>
                    <div>
                      <strong>No Disclosure:</strong><br />
                      <AffiliateLink 
                        product={allProducts[0]} 
                        showDisclosure={false}
                        className="btn btn-outline-success btn-sm"
                      >
                        View Details
                      </AffiliateLink>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* AffiliateCard Demo */}
            <div className="col-lg-6 mb-4">
              <div className="card h-100">
                <div className="card-header">
                  <h5 className="card-title mb-0">
                    <i className="bi bi-card-text me-2"></i>
                    AffiliateCard Component
                  </h5>
                </div>
                <div className="card-body">
                  <p className="text-muted">Rich product cards with images and details:</p>
                  {featuredProducts.length > 0 && (
                    <AffiliateCard 
                      product={featuredProducts[0]} 
                      layout="horizontal"
                      imageHeight={120}
                      compact={true}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Featured Products Section */}
          {featuredProducts.length > 0 && (
            <section className="mb-5">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h2 className="h3 mb-0">
                  <i className="bi bi-star-fill text-warning me-2"></i>
                  Featured Products
                </h2>
                <span className="badge bg-primary">{featuredProducts.length} products</span>
              </div>
              <AffiliateGrid
                products={featuredProducts}
                columns={{ xs: 1, sm: 2, md: 2, lg: 3, xl: 4 }}
                layout="vertical"
                showRatings={true}
                showCategories={true}
              />
            </section>
          )}

          {/* All Products Section */}
          <section className="mb-5">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h2 className="h3 mb-0">
                <i className="bi bi-grid-3x3-gap me-2"></i>
                Product Catalog
              </h2>
              <span className="badge bg-secondary">{allProducts.length} total products</span>
            </div>
            <AffiliateGrid
              category={selectedCategory !== 'all' ? selectedCategory as any : undefined}
              searchQuery={searchQuery}
              layout={layout}
              columns={{ xs: 1, sm: 2, md: 2, lg: 3, xl: 4 }}
              showRatings={true}
              showCategories={true}
              sortBy="featured"
              emptyStateMessage="No products match your search criteria"
            />
          </section>

          {/* Category Showcase */}
          <section className="mb-5">
            <h2 className="h3 mb-4">
              <i className="bi bi-tags me-2"></i>
              Categories Overview
            </h2>
            <div className="row g-4">
              {['tax', 'trading', 'finance', 'business'].map(category => {
                const categoryProducts = getAffiliateProductsByCategory(category as any);
                return (
                  <div key={category} className="col-lg-6">
                    <div className="card">
                      <div className="card-header">
                        <h5 className="card-title mb-0 text-capitalize">
                          {category} ({categoryProducts.length})
                        </h5>
                      </div>
                      <div className="card-body">
                        {categoryProducts.length > 0 ? (
                          <AffiliateGrid
                            products={categoryProducts.slice(0, 2)}
                            columns={{ xs: 1, sm: 2 }}
                            layout="horizontal"
                            showCategories={false}
                            showRatings={true}
                          />
                        ) : (
                          <p className="text-muted text-center py-3">
                            No products in this category yet.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Disclosure Styles Demo */}
          <section className="mb-5">
            <h2 className="h3 mb-4">
              <i className="bi bi-shield-check me-2"></i>
              Disclosure Styles
            </h2>
            <div className="row g-4">
              <div className="col-md-4">
                <h6>Inline Style</h6>
                <p>
                  Check out this amazing book
                  <AffiliateDisclosure style="inline" />
                </p>
              </div>
              <div className="col-md-8">
                <h6>Footer Style</h6>
                <AffiliateDisclosure style="footer" />
              </div>
            </div>
          </section>

          {/* Performance Stats */}
          <section className="mb-5">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">
                  <i className="bi bi-graph-up me-2"></i>
                  System Statistics
                </h5>
              </div>
              <div className="card-body">
                <div className="row text-center">
                  <div className="col-md-3">
                    <div className="h4 text-primary">{allProducts.length}</div>
                    <small className="text-muted">Total Products</small>
                  </div>
                  <div className="col-md-3">
                    <div className="h4 text-success">{featuredProducts.length}</div>
                    <small className="text-muted">Featured Products</small>
                  </div>
                  <div className="col-md-3">
                    <div className="h4 text-info">
                      {Array.from(new Set(allProducts.map(p => p.category))).length}
                    </div>
                    <small className="text-muted">Categories</small>
                  </div>
                  <div className="col-md-3">
                    <div className="h4 text-warning">
                      {(allProducts.reduce((sum, p) => sum + (p.rating || 0), 0) / allProducts.length).toFixed(1)}
                    </div>
                    <small className="text-muted">Avg Rating</small>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Implementation Guide */}
          <section className="mb-5">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">
                  <i className="bi bi-code-square me-2"></i>
                  Quick Implementation Guide
                </h5>
              </div>
              <div className="card-body">
                <h6>1. Import Components</h6>
                <pre className="bg-light p-3 rounded">
{`import {
  AffiliateLink,
  AffiliateCard,
  AffiliateGrid,
  AffiliateDisclosure
} from './components/affiliate';`}
                </pre>

                <h6>2. Basic Usage</h6>
                <pre className="bg-light p-3 rounded">
{`// Simple affiliate link
<AffiliateLink product={product} />

// Product grid
<AffiliateGrid category="tax" limit={6} />

// FTC disclosure
<AffiliateDisclosure style="banner" />`}
                </pre>

                <h6>3. Add to Your Pages</h6>
                <ul>
                  <li>Tax Calculator: Show tax guide books</li>
                  <li>Trading Tools: Display trading psychology books</li>
                  <li>Blog Posts: Relevant book recommendations</li>
                  <li>Footer: Legal disclosures</li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AffiliateDemo;