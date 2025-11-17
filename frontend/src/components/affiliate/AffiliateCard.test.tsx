/**
 * AffiliateCard Component Tests
 * Tests for image fallback functionality and component rendering
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AffiliateCard from './AffiliateCard';
import { AffiliateProduct } from '../../types/affiliate';

// Mock affiliate product data
const mockProduct: AffiliateProduct = {
  id: 'test-book',
  title: 'Test Book Title',
  description: 'A comprehensive test book for affiliate functionality',
  asin: 'B0123456789',
  affiliateUrl: 'https://amzn.to/test123',
  imageUrl: 'https://example.com/test-image.jpg',
  fallbackImageUrl: '/images/test-fallback.jpg',
  category: 'tax',
  tags: ['test', 'book'],
  price: '£19.99',
  rating: 4.5,
  reviewCount: 100,
  featured: true,
  author: 'Test Author',
  publishedDate: '2024-01-01',
  isbn: '978-0123456789'
};

const mockProductWithoutFallback: AffiliateProduct = {
  ...mockProduct,
  id: 'test-book-no-fallback',
  fallbackImageUrl: undefined
};

describe('AffiliateCard Image Fallback', () => {
  beforeEach(() => {
    // Mock console.error to avoid noise in test output
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders product image successfully', () => {
    render(<AffiliateCard product={mockProduct} />);

    const image = screen.getByAltText('Test Book Title');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://example.com/test-image.jpg');
  });

  test('falls back to product fallbackImageUrl when main image fails', () => {
    render(<AffiliateCard product={mockProduct} />);

    const image = screen.getByAltText('Test Book Title');

    // Simulate image load error
    fireEvent.error(image);

    // Should now use the fallback image URL from product data
    expect(image).toHaveAttribute('src', '/images/test-fallback.jpg');
  });

  test('falls back to default placeholder when no product fallbackImageUrl', () => {
    render(<AffiliateCard product={mockProductWithoutFallback} />);

    const image = screen.getByAltText('Test Book Title');

    // Simulate image load error
    fireEvent.error(image);

    // Should use default placeholder
    expect(image).toHaveAttribute('src', '/images/book-placeholder.jpg');
  });

  test('handles horizontal layout image fallback', () => {
    render(<AffiliateCard product={mockProduct} layout="horizontal" />);

    const image = screen.getByAltText('Test Book Title');

    // Simulate image load error
    fireEvent.error(image);

    // Should use fallback image URL
    expect(image).toHaveAttribute('src', '/images/test-fallback.jpg');
  });

  test('maintains image attributes after fallback', () => {
    render(<AffiliateCard product={mockProduct} imageHeight={250} />);

    const image = screen.getByAltText('Test Book Title');

    // Check initial attributes
    expect(image).toHaveAttribute('loading', 'lazy');
    expect(image).toHaveClass('card-img-top');
    // Style is inline, no need to check height in style object

    // Simulate error and check attributes are preserved
    fireEvent.error(image);

    expect(image).toHaveAttribute('loading', 'lazy');
    expect(image).toHaveClass('card-img-top');
    expect(image).toHaveAttribute('src', '/images/test-fallback.jpg');
  });

  test('prevents multiple fallback triggers', () => {
    render(<AffiliateCard product={mockProduct} />);

    const image = screen.getByAltText('Test Book Title');

    // Simulate multiple errors (should only fallback once)
    fireEvent.error(image);
    fireEvent.error(image);
    fireEvent.error(image);

    // Should only have the fallback image URL, not keep changing
    expect(image).toHaveAttribute('src', '/images/test-fallback.jpg');
  });

  test('does not trigger fallback on successful image load', () => {
    render(<AffiliateCard product={mockProduct} />);

    const image = screen.getByAltText('Test Book Title');

    // Simulate successful load
    fireEvent.load(image);

    // Should still have original image URL
    expect(image).toHaveAttribute('src', 'https://example.com/test-image.jpg');
  });
});

describe('AffiliateCard Basic Rendering', () => {
  test('displays product title and author', () => {
    render(<AffiliateCard product={mockProduct} />);

    expect(screen.getByText('Test Book Title')).toBeInTheDocument();
    expect(screen.getByText('by Test Author')).toBeInTheDocument();
  });

  test('displays product price', () => {
    render(<AffiliateCard product={mockProduct} />);

    expect(screen.getByText('£19.99')).toBeInTheDocument();
  });

  test('displays rating when showRating is true', () => {
    render(<AffiliateCard product={mockProduct} showRating={true} />);

    // Should show rating stars and count
    expect(screen.getByText('(4.5)')).toBeInTheDocument();
  });

  test('hides rating when showRating is false', () => {
    render(<AffiliateCard product={mockProduct} showRating={false} />);

    expect(screen.queryByText('(4.5)')).not.toBeInTheDocument();
  });

  test('displays affiliate link button', () => {
    render(<AffiliateCard product={mockProduct} />);

    // It's a link styled as a button, not a button element
    const link = screen.getByRole('link', { name: /View on Amazon/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveClass('btn', 'btn-primary');
  });

  test('shows featured badge for featured products', () => {
    render(<AffiliateCard product={mockProduct} />);

    expect(screen.getByText('Featured')).toBeInTheDocument();
  });

  test('shows category badge', () => {
    render(<AffiliateCard product={mockProduct} />);

    expect(screen.getByText('tax')).toBeInTheDocument();
  });
});
