/**
 * AffiliateCard Component
 * Displays an affiliate product as a responsive card with image, details, and CTA
 */

import React from 'react';
import { AffiliateCardProps } from '../../types/affiliate';
import AffiliateLink from './AffiliateLink';

const AffiliateCard: React.FC<AffiliateCardProps> = ({
  product,
  layout = 'vertical',
  showFullDescription = false,
  showRating = true,
  showPrice = true,
  className = '',
  imageHeight = 200,
  ctaText = 'View on Amazon',
  compact = false
}) => {
  const cardClassName = [
    'affiliate-card',
    'card',
    'h-100',
    `affiliate-card--${layout}`,
    compact && 'affiliate-card--compact',
    className
  ].filter(Boolean).join(' ');

  const description = showFullDescription 
    ? product.description 
    : product.description.length > 120 
      ? `${product.description.substring(0, 120)}...` 
      : product.description;

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - Math.ceil(rating);
    
    return (
      <div className="affiliate-rating d-flex align-items-center">
        {[...Array(fullStars)].map((_, i) => (
          <i key={`full-${i}`} className="bi bi-star-fill text-warning"></i>
        ))}
        {hasHalfStar && <i className="bi bi-star-half text-warning"></i>}
        {[...Array(emptyStars)].map((_, i) => (
          <i key={`empty-${i}`} className="bi bi-star text-warning"></i>
        ))}
        <span className="ms-2 text-muted small">({rating})</span>
      </div>
    );
  };

  const renderVerticalLayout = () => (
    <>
      <div className="affiliate-card__image">
        <img
          src={product.imageUrl}
          alt={product.title}
          className="card-img-top"
          style={{ height: `${imageHeight}px`, objectFit: 'contain' }}
          loading="lazy"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            // Use fallback image from product data, or default placeholder
            if (target.src !== (product.fallbackImageUrl || '/images/book-placeholder.jpg')) {
              target.src = product.fallbackImageUrl || '/images/book-placeholder.jpg';
            }
          }}
        />
      </div>
      <div className="card-body d-flex flex-column">
        <div className="affiliate-card__content flex-grow-1">
          <h5 className="card-title affiliate-product-title">{product.title}</h5>
          {product.author && (
            <h6 className="card-subtitle mb-2 text-muted">by {product.author}</h6>
          )}
          <p className="card-text affiliate-product-description">
            {description}
          </p>
          {showRating && product.rating && (
            <div className="mb-2">
              {renderStars(product.rating)}
            </div>
          )}
          {showPrice && product.price && (
            <div className="affiliate-price mb-2">
              <span className="h6 text-primary">{product.price}</span>
              {product.originalPrice && product.originalPrice !== product.price && (
                <span className="text-muted text-decoration-line-through ms-2 small">
                  {product.originalPrice}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="affiliate-card__actions mt-auto">
          <AffiliateLink
            product={product}
            className="btn btn-primary w-100"
            showDisclosure={false}
          >
            <i className="bi bi-cart3 me-2"></i>
            {ctaText}
          </AffiliateLink>
        </div>
      </div>
    </>
  );

  const renderHorizontalLayout = () => (
    <div className="row g-0">
      <div className="col-md-4">
        <div className="affiliate-card__image">
          <img
            src={product.imageUrl}
            alt={product.title}
            className="img-fluid rounded-start h-100"
            style={{ objectFit: 'contain' }}
            loading="lazy"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (target.src !== (product.fallbackImageUrl || '/images/book-placeholder.jpg')) {
                target.src = product.fallbackImageUrl || '/images/book-placeholder.jpg';
              }
            }}
          />
        </div>
      </div>
      <div className="col-md-8">
        <div className="card-body d-flex flex-column h-100">
          <div className="affiliate-card__content flex-grow-1">
            <h5 className="card-title affiliate-product-title">{product.title}</h5>
            {product.author && (
              <h6 className="card-subtitle mb-2 text-muted">by {product.author}</h6>
            )}
            <p className="card-text affiliate-product-description">
              {description}
            </p>
            {showRating && product.rating && (
              <div className="mb-2">
                {renderStars(product.rating)}
              </div>
            )}
            {showPrice && product.price && (
              <div className="affiliate-price mb-2">
                <span className="h6 text-primary">{product.price}</span>
                {product.originalPrice && product.originalPrice !== product.price && (
                  <span className="text-muted text-decoration-line-through ms-2 small">
                    {product.originalPrice}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="affiliate-card__actions mt-auto">
            <AffiliateLink
              product={product}
              className="btn btn-primary"
              showDisclosure={false}
            >
              <i className="bi bi-cart3 me-2"></i>
              {ctaText}
            </AffiliateLink>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={cardClassName}>
      {layout === 'horizontal' ? renderHorizontalLayout() : renderVerticalLayout()}
      
      {/* Category badge */}
      {product.category && (
        <div className="position-absolute top-0 end-0 m-2">
          <span className={`badge bg-${getCategoryColor(product.category)}`}>
            {product.category}
          </span>
        </div>
      )}
      
      {/* Featured badge */}
      {product.featured && (
        <div className="position-absolute top-0 start-0 m-2">
          <span className="badge bg-warning text-dark">
            <i className="bi bi-star-fill me-1"></i>
            Featured
          </span>
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

export default AffiliateCard;
