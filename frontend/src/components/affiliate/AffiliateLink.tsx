/**
 * AffiliateLink Component
 * Renders a clickable affiliate link with proper FTC disclosure and tracking
 */

import React from 'react';
import { AffiliateLinkProps } from '../../types/affiliate';
import { trackAffiliateClick } from '../../utils/affiliateLoader';

const AffiliateLink: React.FC<AffiliateLinkProps> = ({
  product,
  children,
  className = '',
  showDisclosure = true,
  disclosureText,
  onClick,
  target = '_blank',
  rel = 'noopener noreferrer sponsored',
  ...props
}) => {
  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    // Track the affiliate click
    trackAffiliateClick(product);
    
    // Call custom onClick if provided
    if (onClick) {
      onClick(event);
    }
  };

  const linkClassName = `affiliate-link ${className}`.trim();

  return (
    <>
      <a
        href={product.affiliateUrl}
        className={linkClassName}
        target={target}
        rel={rel}
        onClick={handleClick}
        title={`View ${product.title} on Amazon`}
        data-product-id={product.id}
        data-asin={product.asin}
        {...props}
      >
        {children || product.title}
      </a>
      {showDisclosure && (
        <small className="affiliate-disclosure text-muted ms-1">
          {disclosureText || '*'}
        </small>
      )}
    </>
  );
};

export default AffiliateLink;