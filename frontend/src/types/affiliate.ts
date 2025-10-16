/**
 * Affiliate Marketing System Types
 * Defines interfaces for Amazon affiliate product data and components
 */

export interface AffiliateProduct {
  /** Unique identifier for the product */
  id: string;

  /** Product title/name */
  title: string;

  /** Product description */
  description: string;

  /** Amazon ASIN (product identifier) */
  asin: string;

  /** Amazon affiliate URL with tracking */
  affiliateUrl: string;

  /** Product image URL */
  imageUrl: string;

  /** Fallback image URL for when main image fails to load */
  fallbackImageUrl?: string;
  
  /** Product category */
  category: 'tax' | 'trading' | 'finance' | 'business';
  
  /** Product tags for filtering */
  tags: string[];
  
  /** Approximate price (for display purposes) */
  price?: string;
  
  /** Original price (if on sale) */
  originalPrice?: string;
  
  /** Star rating (1-5) */
  rating?: number;
  
  /** Number of reviews */
  reviewCount?: number;
  
  /** Whether this is a featured/recommended product */
  featured?: boolean;
  
  /** Publication date (for books) */
  publishedDate?: string;
  
  /** Author name (for books) */
  author?: string;
  
  /** ISBN for books */
  isbn?: string;
}

export interface AffiliateGridProps {
  /** Array of affiliate products to display (optional, will load from data if not provided) */
  products?: AffiliateProduct[];
  
  /** Grid layout columns (responsive object or simple number) */
  columns?: 2 | 3 | 4 | {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  
  /** Category filter */
  category?: AffiliateProduct['category'];
  
  /** Show only featured products */
  featuredOnly?: boolean;
  
  /** Maximum number of products to show */
  limit?: number;
  
  /** Custom CSS class */
  className?: string;
  
  /** Show category badges */
  showCategories?: boolean;
  
  /** Show ratings/reviews */
  showRatings?: boolean;
  
  /** Card layout style */
  layout?: 'vertical' | 'horizontal';
  
  /** Search query to filter products */
  searchQuery?: string;
  
  /** Sort products by */
  sortBy?: 'default' | 'title' | 'rating' | 'category' | 'featured';
  
  /** Empty state message */
  emptyStateMessage?: string;
  
  /** Loading state */
  loading?: boolean;
}

export interface AffiliateLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  /** Affiliate product data */
  product: AffiliateProduct;
  
  /** Link text override */
  children?: React.ReactNode;
  
  /** Button style variant (optional) */
  variant?: 'primary' | 'secondary' | 'outline' | 'link';
  
  /** Button size (optional) */
  size?: 'sm' | 'md' | 'lg';
  
  /** Custom CSS class */
  className?: string;
  
  /** Track clicks for analytics */
  trackClicks?: boolean;
  
  /** Show price in link */
  showPrice?: boolean;
  
  /** Show FTC disclosure */
  showDisclosure?: boolean;
  
  /** Custom disclosure text */
  disclosureText?: string;
}

export interface AffiliateCardProps {
  /** Affiliate product data */
  product: AffiliateProduct;
  
  /** Card layout style */
  layout?: 'vertical' | 'horizontal';
  
  /** Show full description or truncated */
  showFullDescription?: boolean;
  
  /** Custom CSS class */
  className?: string;
  
  /** Show category badge */
  showCategory?: boolean;
  
  /** Show rating/reviews */
  showRating?: boolean;
  
  /** Show price information */
  showPrice?: boolean;
  
  /** Image height in pixels */
  imageHeight?: number;
  
  /** CTA button text */
  ctaText?: string;
  
  /** Compact card style */
  compact?: boolean;
  
  /** Image aspect ratio */
  imageAspectRatio?: 'square' | 'portrait' | 'auto';
}

export interface AffiliateDisclosureProps {
  /** Disclosure text override */
  text?: string;
  
  /** Disclosure style */
  style?: 'banner' | 'inline' | 'footer';
  
  /** Custom CSS class */
  className?: string;
  
  /** Show disclosure icon */
  showIcon?: boolean;
  
  /** Show Amazon logo */
  showLogo?: boolean;
}

/**
 * Analytics event for affiliate link clicks
 */
export interface AffiliateClickEvent {
  productId: string;
  productTitle: string;
  category: string;
  affiliateUrl: string;
  timestamp: Date;
  userAgent?: string;
}

/**
 * Configuration for affiliate system
 */
export interface AffiliateConfig {
  /** Amazon Associate tag */
  associateTag: string;
  
  /** Default disclosure text */
  defaultDisclosure: string;
  
  /** Enable click tracking */
  enableTracking: boolean;
  
  /** Default image placeholder */
  placeholderImage: string;
  
  /** Base Amazon URL */
  amazonBaseUrl: string;
}

/**
 * Validation schema for affiliate products
 */
export interface AffiliateValidationError {
  field: string;
  message: string;
  value?: any;
}
