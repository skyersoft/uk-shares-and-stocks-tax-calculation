/**
 * AffiliateGrid Component
 * Displays a responsive grid of affiliate product cards
 */

import React from 'react';
import { AffiliateGridProps } from '../../types/affiliate';
import AffiliateCard from './AffiliateCard';
import { 
  getAllAffiliateProducts, 
  getAffiliateProductsByCategory, 
  getFeaturedAffiliateProducts,
  searchAffiliateProducts
} from '../../utils/affiliateLoader';

const AffiliateGrid: React.FC<AffiliateGridProps> = ({
  products: providedProducts,
  category,
  featuredOnly = false,
  limit,
  className = '',
  showCategories = false,
  showRatings = true,
  layout = 'vertical',
  columns = { xs: 1, sm: 2, md: 2, lg: 3, xl: 4 },
  searchQuery,
  sortBy = 'default',
  emptyStateMessage = 'No products found',
  loading = false
}) => {
  // Determine which products to display
  const getProducts = () => {
    // Use provided products if available
    if (providedProducts) {
      return providedProducts;
    }
    
    let products = [];
    
    // Get products based on filters
    if (featuredOnly) {
      products = getFeaturedAffiliateProducts();
    } else if (category) {
      products = getAffiliateProductsByCategory(category);
    } else {
      products = getAllAffiliateProducts();
    }
    
    // Apply search filter
    if (searchQuery && searchQuery.trim()) {
      products = searchAffiliateProducts(searchQuery);
    }
    
    // Apply sorting
    switch (sortBy) {
      case 'rating':
        products = products
          .filter(p => p.rating !== undefined)
          .sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'title':
        products = products.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'category':
        products = products.sort((a, b) => a.category.localeCompare(b.category));
        break;
      case 'featured':
        products = products.sort((a, b) => {
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          return 0;
        });
        break;
      default:
        // Keep default order
        break;
    }
    
    // Apply limit
    if (limit && limit > 0) {
      products = products.slice(0, limit);
    }
    
    return products;
  };

  const products = getProducts();
  
  // Generate responsive column classes
  const getColumnClasses = () => {
    const classes = [];
    
    // Handle responsive object or simple number
    if (typeof columns === 'object' && columns !== null) {
      if (columns.xs) classes.push(`col-${12 / columns.xs}`);
      if (columns.sm) classes.push(`col-sm-${12 / columns.sm}`);
      if (columns.md) classes.push(`col-md-${12 / columns.md}`);
      if (columns.lg) classes.push(`col-lg-${12 / columns.lg}`);
      if (columns.xl) classes.push(`col-xl-${12 / columns.xl}`);
    } else {
      // Simple number - apply to md and up
      const cols = columns || 3;
      classes.push(`col-12 col-md-${12 / cols}`);
    }
    
    return classes.join(' ');
  };

  const gridClassName = [
    'affiliate-grid',
    className
  ].filter(Boolean).join(' ');

  // Loading state
  if (loading) {
    return (
      <div className={gridClassName}>
        <div className="row">
          {[...Array(typeof columns === 'object' ? (columns.md || 2) : (columns || 2))].map((_, index) => (
            <div key={index} className={getColumnClasses()}>
              <div className="card h-100">
                <div className="card-img-top bg-light" style={{ height: '200px' }}>
                  <div className="d-flex align-items-center justify-content-center h-100">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                </div>
                <div className="card-body">
                  <div className="placeholder-glow">
                    <h5 className="placeholder col-8"></h5>
                    <h6 className="placeholder col-6"></h6>
                    <p className="placeholder col-12"></p>
                    <p className="placeholder col-8"></p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (products.length === 0) {
    return (
      <div className={gridClassName}>
        <div className="text-center py-5">
          <i className="bi bi-search display-4 text-muted mb-3"></i>
          <h4 className="text-muted">{emptyStateMessage}</h4>
          {searchQuery && (
            <p className="text-muted">
              No products found for "{searchQuery}". Try adjusting your search terms.
            </p>
          )}
          {category && (
            <p className="text-muted">
              No products found in the "{category}" category.
            </p>
          )}
          <p className="text-muted small mt-2">
            📚 Tax resources will be available soon. Check back later!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={gridClassName}>
      {/* Products count and filters */}
      <div className="affiliate-grid__header mb-3 d-flex justify-content-between align-items-center">
        <small className="text-muted">
          Showing {products.length} product{products.length !== 1 ? 's' : ''}
          {category && ` in ${category}`}
          {searchQuery && ` for "${searchQuery}"`}
        </small>
        
        {/* Category badges */}
        {showCategories && (
          <div className="affiliate-grid__categories">
            {Array.from(new Set(products.map(p => p.category))).map(cat => (
              <span key={cat} className={`badge bg-${getCategoryColor(cat)} me-1`}>
                {cat}
              </span>
            ))}
          </div>
        )}
      </div>
      
      {/* Products grid */}
      <div className="row g-4">
        {products.map((product) => (
          <div key={product.id} className={getColumnClasses()}>
            <AffiliateCard
              product={product}
              layout={layout}
              showRating={showRatings}
              className="h-100"
            />
          </div>
        ))}
      </div>
      
      {/* Show more products link if limit was applied */}
      {limit && getAllAffiliateProducts().length > limit && (
        <div className="text-center mt-4">
          <p className="text-muted">
            Showing {limit} of {getAllAffiliateProducts().length} products
          </p>
        </div>
      )}
    </div>
  );
};

/**
 * Get Bootstrap color class for category
 */
function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    tax: 'success',
    trading: 'primary', 
    finance: 'info',
    business: 'secondary'
  };
  return colors[category] || 'secondary';
}

export default AffiliateGrid;
