/**
 * Affiliate Products Data Loader
 * Handles loading, validation, and filtering of affiliate product data
 */

import { affiliateData } from '../data/affiliateProducts';
import { AffiliateProduct, AffiliateConfig, AffiliateValidationError } from '../types/affiliate';

let productsCache: AffiliateProduct[] | null = null;
let configCache: AffiliateConfig | null = null;

/**
 * Validates a single affiliate product
 */
function validateProduct(product: any, index: number): AffiliateValidationError[] {
  const errors: AffiliateValidationError[] = [];
  const requiredFields = ['id', 'title', 'description', 'asin', 'affiliateUrl', 'imageUrl', 'category'];
  
  requiredFields.forEach(field => {
    if (!product[field] || (typeof product[field] === 'string' && product[field].trim() === '')) {
      errors.push({
        field: `products[${index}].${field}`,
        message: `Missing required field: ${field}`,
        value: product[field]
      });
    }
  });
  
  // Validate category
  const validCategories = ['tax', 'trading', 'finance', 'business', 'investing'];
  if (product.category && !validCategories.includes(product.category)) {
    errors.push({
      field: `products[${index}].category`,
      message: `Invalid category. Must be one of: ${validCategories.join(', ')}`,
      value: product.category
    });
  }
  
  // Validate ASIN format (should be 10 characters, alphanumeric)
  if (product.asin && !/^[A-Z0-9]{10}$/.test(product.asin)) {
    errors.push({
      field: `products[${index}].asin`,
      message: 'ASIN must be 10 alphanumeric characters',
      value: product.asin
    });
  }
  
  // Validate URLs
  if (product.affiliateUrl && !isValidUrl(product.affiliateUrl)) {
    errors.push({
      field: `products[${index}].affiliateUrl`,
      message: 'Invalid affiliate URL format',
      value: product.affiliateUrl
    });
  }
  
  if (product.imageUrl && !isValidUrl(product.imageUrl)) {
    errors.push({
      field: `products[${index}].imageUrl`,
      message: 'Invalid image URL format',
      value: product.imageUrl
    });
  }
  
  // Validate rating (1-5)
  if (product.rating !== undefined && (product.rating < 1 || product.rating > 5)) {
    errors.push({
      field: `products[${index}].rating`,
      message: 'Rating must be between 1 and 5',
      value: product.rating
    });
  }
  
  return errors;
}

/**
 * Simple URL validation
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates the affiliate data structure
 */
function validateAffiliateData(): AffiliateValidationError[] {
  const errors: AffiliateValidationError[] = [];
  
  if (!affiliateData.config) {
    errors.push({
      field: 'config',
      message: 'Missing config section'
    });
  } else {
    const configRequiredFields = ['associateTag', 'defaultDisclosure', 'amazonBaseUrl'];
    configRequiredFields.forEach(field => {
      if (!affiliateData.config[field as keyof typeof affiliateData.config]) {
        errors.push({
          field: `config.${field}`,
          message: `Missing required config field: ${field}`
        });
      }
    });
  }
  
  if (!affiliateData.products || !Array.isArray(affiliateData.products)) {
    errors.push({
      field: 'products',
      message: 'Products must be an array'
    });
  } else {
    // Check for duplicate IDs
    const ids = new Set<string>();
    affiliateData.products.forEach((product, index) => {
      if (product.id) {
        if (ids.has(product.id)) {
          errors.push({
            field: `products[${index}].id`,
            message: `Duplicate product ID: ${product.id}`,
            value: product.id
          });
        }
        ids.add(product.id);
      }
      
      // Validate individual product
      errors.push(...validateProduct(product, index));
    });
  }
  
  return errors;
}

/**
 * Gets the affiliate configuration
 */
export function getAffiliateConfig(): AffiliateConfig {
  if (!configCache) {
    const validationErrors = validateAffiliateData();
    if (validationErrors.length > 0) {
      console.error('[AffiliateLoader] Validation errors:', validationErrors);
      // Return default config if validation fails
      configCache = {
        associateTag: 'cgttaxtool-20',
        defaultDisclosure: 'As an Amazon Associate, we earn from qualifying purchases.',
        enableTracking: true,
        placeholderImage: '/images/book-placeholder.jpg',
        amazonBaseUrl: 'https://www.amazon.co.uk'
      };
    } else {
      configCache = affiliateData.config as AffiliateConfig;
    }
  }
  return configCache;
}

/**
 * Gets all affiliate products
 */
export function getAllAffiliateProducts(): AffiliateProduct[] {
  if (!productsCache) {
    const validationErrors = validateAffiliateData();
    if (validationErrors.length > 0) {
      console.error('[AffiliateLoader] Validation errors:', validationErrors);
      return [];
    }
    productsCache = affiliateData.products as AffiliateProduct[];
  }
  return [...productsCache]; // Return copy to prevent mutation
}

/**
 * Gets affiliate products by category
 */
export function getAffiliateProductsByCategory(category: AffiliateProduct['category']): AffiliateProduct[] {
  return getAllAffiliateProducts().filter(product => product.category === category);
}

/**
 * Gets featured affiliate products
 */
export function getFeaturedAffiliateProducts(): AffiliateProduct[] {
  return getAllAffiliateProducts().filter(product => product.featured);
}

/**
 * Gets a single affiliate product by ID
 */
export function getAffiliateProductById(id: string): AffiliateProduct | undefined {
  return getAllAffiliateProducts().find(product => product.id === id);
}

/**
 * Searches affiliate products by title, description, or tags
 */
export function searchAffiliateProducts(query: string): AffiliateProduct[] {
  const searchTerm = query.toLowerCase().trim();
  if (!searchTerm) return getAllAffiliateProducts();
  
  return getAllAffiliateProducts().filter(product => 
    product.title.toLowerCase().includes(searchTerm) ||
    product.description.toLowerCase().includes(searchTerm) ||
    product.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
    (product.author && product.author.toLowerCase().includes(searchTerm))
  );
}

/**
 * Gets affiliate products sorted by rating (highest first)
 */
export function getTopRatedAffiliateProducts(limit?: number): AffiliateProduct[] {
  const products = getAllAffiliateProducts()
    .filter(product => product.rating !== undefined)
    .sort((a, b) => (b.rating || 0) - (a.rating || 0));
  
  return limit ? products.slice(0, limit) : products;
}

/**
 * Clears the affiliate products cache (useful for testing)
 */
export function clearAffiliateCache(): void {
  productsCache = null;
  configCache = null;
}

/**
 * Validates affiliate data and returns any errors
 */
export function getAffiliateValidationErrors(): AffiliateValidationError[] {
  return validateAffiliateData();
}

/**
 * Tracks affiliate link click for analytics
 */
export function trackAffiliateClick(product: AffiliateProduct): void {
  const config = getAffiliateConfig();
  if (!config.enableTracking) return;
  
  try {
    // Log click event
    console.log('[AffiliateLoader] Affiliate click tracked:', {
      productId: product.id,
      productTitle: product.title,
      category: product.category,
      timestamp: new Date().toISOString()
    });
    
    // Here you could send to analytics service like Google Analytics
    // gtag('event', 'affiliate_click', {
    //   'product_id': product.id,
    //   'product_category': product.category,
    //   'product_title': product.title
    // });
  } catch (error) {
    console.error('[AffiliateLoader] Error tracking affiliate click:', error);
  }
}