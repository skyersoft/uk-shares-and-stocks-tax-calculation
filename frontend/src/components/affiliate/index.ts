/**
 * Affiliate Components Index
 * Central export point for all affiliate marketing components
 */

export { default as AffiliateLink } from './AffiliateLink';
export { default as AffiliateCard } from './AffiliateCard';
export { default as AffiliateGrid } from './AffiliateGrid';
export { default as AffiliateDisclosure } from './AffiliateDisclosure';

// Re-export types for convenience
export type {
  AffiliateProduct,
  AffiliateConfig,
  AffiliateLinkProps,
  AffiliateCardProps,
  AffiliateGridProps,
  AffiliateDisclosureProps,
  AffiliateClickEvent,
  AffiliateValidationError
} from '../../types/affiliate';

// Re-export utilities
export {
  getAllAffiliateProducts,
  getAffiliateProductsByCategory,
  getFeaturedAffiliateProducts,
  getAffiliateProductById,
  searchAffiliateProducts,
  getTopRatedAffiliateProducts,
  getAffiliateConfig,
  trackAffiliateClick,
  clearAffiliateCache,
  getAffiliateValidationErrors
} from '../../utils/affiliateLoader';