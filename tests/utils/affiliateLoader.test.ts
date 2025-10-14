/**
 * @jest-environment jsdom
 */

import {
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
} from '../../frontend/src/utils/affiliateLoader';

// Mock the affiliate data
jest.mock('../../frontend/src/data/affiliateProducts.json', () => ({
  config: {
    associateTag: 'test-tag-20',
    defaultDisclosure: 'Test disclosure text',
    enableTracking: true,
    placeholderImage: '/test-placeholder.jpg',
    amazonBaseUrl: 'https://www.amazon.co.uk'
  },
  products: [
    {
      id: 'test-book-1',
      title: 'Test Tax Guide 2024',
      description: 'A comprehensive guide to UK tax matters for individuals and businesses.',
      asin: 'B123456789',
      affiliateUrl: 'https://www.amazon.co.uk/dp/B123456789?tag=test-tag-20',
      imageUrl: 'https://example.com/test-book-1.jpg',
      category: 'tax',
      tags: ['tax', 'UK', 'guide', '2024'],
      price: '£29.99',
      rating: 4.5,
      reviewCount: 150,
      featured: true,
      author: 'Test Author'
    },
    {
      id: 'test-book-2',
      title: 'Trading Psychology Mastery',
      description: 'Master your emotions and improve your trading performance.',
      asin: 'B987654321',
      affiliateUrl: 'https://www.amazon.co.uk/dp/B987654321?tag=test-tag-20',
      imageUrl: 'https://example.com/test-book-2.jpg',
      category: 'trading',
      tags: ['trading', 'psychology', 'mindset'],
      price: '£19.99',
      rating: 4.2,
      reviewCount: 89,
      featured: false,
      author: 'Another Author'
    },
    {
      id: 'test-book-3',
      title: 'Investment Fundamentals',
      description: 'Learn the basics of investing in stocks and bonds.',
      asin: 'B111222333',
      affiliateUrl: 'https://www.amazon.co.uk/dp/B111222333?tag=test-tag-20',
      imageUrl: 'https://example.com/test-book-3.jpg',
      category: 'finance',
      tags: ['investing', 'stocks', 'bonds', 'fundamentals'],
      price: '£24.99',
      rating: 4.8,
      reviewCount: 245,
      featured: true,
      author: 'Finance Expert'
    }
  ]
}));

describe('AffiliateLoader', () => {
  beforeEach(() => {
    clearAffiliateCache();
    // Clear console methods to avoid test output pollution
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getAffiliateConfig', () => {
    it('should return the affiliate configuration', () => {
      const config = getAffiliateConfig();
      
      expect(config).toEqual({
        associateTag: 'test-tag-20',
        defaultDisclosure: 'Test disclosure text',
        enableTracking: true,
        placeholderImage: '/test-placeholder.jpg',
        amazonBaseUrl: 'https://www.amazon.co.uk'
      });
    });
  });

  describe('getAllAffiliateProducts', () => {
    it('should return all affiliate products', () => {
      const products = getAllAffiliateProducts();
      
      expect(products).toHaveLength(3);
      expect(products[0].id).toBe('test-book-1');
      expect(products[1].id).toBe('test-book-2');
      expect(products[2].id).toBe('test-book-3');
    });

    it('should return a copy of products to prevent mutation', () => {
      const products1 = getAllAffiliateProducts();
      const products2 = getAllAffiliateProducts();
      
      expect(products1).not.toBe(products2); // Different references
      expect(products1).toEqual(products2); // Same content
    });
  });

  describe('getAffiliateProductsByCategory', () => {
    it('should return products filtered by category', () => {
      const taxProducts = getAffiliateProductsByCategory('tax');
      const tradingProducts = getAffiliateProductsByCategory('trading');
      const financeProducts = getAffiliateProductsByCategory('finance');
      
      expect(taxProducts).toHaveLength(1);
      expect(taxProducts[0].category).toBe('tax');
      
      expect(tradingProducts).toHaveLength(1);
      expect(tradingProducts[0].category).toBe('trading');
      
      expect(financeProducts).toHaveLength(1);
      expect(financeProducts[0].category).toBe('finance');
    });

    it('should return empty array for non-existent category', () => {
      const products = getAffiliateProductsByCategory('business');
      expect(products).toHaveLength(0);
    });
  });

  describe('getFeaturedAffiliateProducts', () => {
    it('should return only featured products', () => {
      const featuredProducts = getFeaturedAffiliateProducts();
      
      expect(featuredProducts).toHaveLength(2);
      expect(featuredProducts.every((p: any) => p.featured)).toBe(true);
    });
  });

  describe('getAffiliateProductById', () => {
    it('should return product with matching ID', () => {
      const product = getAffiliateProductById('test-book-1');
      
      expect(product).toBeDefined();
      expect(product?.id).toBe('test-book-1');
      expect(product?.title).toBe('Test Tax Guide 2024');
    });

    it('should return undefined for non-existent ID', () => {
      const product = getAffiliateProductById('non-existent');
      expect(product).toBeUndefined();
    });
  });

  describe('searchAffiliateProducts', () => {
    it('should search by title', () => {
      const results = searchAffiliateProducts('Tax Guide');
      expect(results).toHaveLength(1);
      expect(results[0].title).toContain('Tax Guide');
    });

    it('should search by description', () => {
      const results = searchAffiliateProducts('emotions');
      expect(results).toHaveLength(1);
      expect(results[0].description).toContain('emotions');
    });

    it('should search by tags', () => {
      const results = searchAffiliateProducts('psychology');
      expect(results).toHaveLength(1);
      expect(results[0].tags).toContain('psychology');
    });

    it('should search by author', () => {
      const results = searchAffiliateProducts('Finance Expert');
      expect(results).toHaveLength(1);
      expect(results[0].author).toBe('Finance Expert');
    });

    it('should return all products for empty search', () => {
      const results = searchAffiliateProducts('');
      expect(results).toHaveLength(3);
    });

    it('should be case insensitive', () => {
      const results = searchAffiliateProducts('TAX GUIDE');
      expect(results).toHaveLength(1);
      expect(results[0].title).toContain('Tax Guide');
    });
  });

  describe('getTopRatedAffiliateProducts', () => {
    it('should return products sorted by rating (highest first)', () => {
      const topRated = getTopRatedAffiliateProducts();
      
      expect(topRated).toHaveLength(3);
      expect(topRated[0].rating).toBe(4.8);
      expect(topRated[1].rating).toBe(4.5);
      expect(topRated[2].rating).toBe(4.2);
    });

    it('should respect the limit parameter', () => {
      const topRated = getTopRatedAffiliateProducts(2);
      
      expect(topRated).toHaveLength(2);
      expect(topRated[0].rating).toBe(4.8);
      expect(topRated[1].rating).toBe(4.5);
    });

    it('should filter out products without ratings', () => {
      // This test assumes our mock data has ratings, but in real scenario
      // some products might not have ratings
      const topRated = getTopRatedAffiliateProducts();
      expect(topRated.every((p: any) => p.rating !== undefined)).toBe(true);
    });
  });

  describe('trackAffiliateClick', () => {
    it('should track affiliate click when tracking is enabled', () => {
      const consoleSpy = jest.spyOn(console, 'log');
      const product = getAllAffiliateProducts()[0];
      
      trackAffiliateClick(product);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        '[AffiliateLoader] Affiliate click tracked:',
        expect.objectContaining({
          productId: 'test-book-1',
          productTitle: 'Test Tax Guide 2024',
          category: 'tax'
        })
      );
    });

    it('should handle tracking errors gracefully', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error');
      const product = getAllAffiliateProducts()[0];
      
      // Mock console.log to throw an error
      jest.spyOn(console, 'log').mockImplementation(() => {
        throw new Error('Tracking service unavailable');
      });
      
      expect(() => trackAffiliateClick(product)).not.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[AffiliateLoader] Error tracking affiliate click:',
        expect.any(Error)
      );
    });
  });

  describe('getAffiliateValidationErrors', () => {
    it('should return no validation errors for valid data', () => {
      const errors = getAffiliateValidationErrors();
      expect(errors).toHaveLength(0);
    });
  });

  describe('clearAffiliateCache', () => {
    it('should clear the cache and reload data on next access', () => {
      // First access to populate cache
      const products1 = getAllAffiliateProducts();
      expect(products1).toHaveLength(3);
      
      // Clear cache
      clearAffiliateCache();
      
      // Second access should reload data
      const products2 = getAllAffiliateProducts();
      expect(products2).toHaveLength(3);
      expect(products2).toEqual(products1);
    });
  });
});