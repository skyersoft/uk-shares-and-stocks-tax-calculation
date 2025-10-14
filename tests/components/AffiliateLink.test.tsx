/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AffiliateLink from '../../frontend/src/components/affiliate/AffiliateLink';
import { trackAffiliateClick } from '../../frontend/src/utils/affiliateLoader';

// Mock the affiliate loader
jest.mock('../../frontend/src/utils/affiliateLoader', () => ({
  trackAffiliateClick: jest.fn()
}));

const mockProduct = {
  id: 'test-book-1',
  title: 'Test Tax Guide 2024',
  description: 'A comprehensive guide to UK tax matters.',
  asin: 'B123456789',
  affiliateUrl: 'https://www.amazon.co.uk/dp/B123456789?tag=test-tag-20',
  imageUrl: 'https://example.com/test-book-1.jpg',
  category: 'tax' as const,
  tags: ['tax', 'UK', 'guide'],
  price: '£29.99',
  rating: 4.5,
  reviewCount: 150,
  featured: true,
  author: 'Test Author'
};

describe('AffiliateLink', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders affiliate link with product title by default', () => {
    render(<AffiliateLink product={mockProduct} />);
    
    const link = screen.getByRole('link');
    expect(link).toHaveTextContent('Test Tax Guide 2024');
    expect(link).toHaveAttribute('href', mockProduct.affiliateUrl);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer sponsored');
    expect(link).toHaveAttribute('title', 'View Test Tax Guide 2024 on Amazon');
  });

  it('renders custom children content', () => {
    render(
      <AffiliateLink product={mockProduct}>
        <span>Buy Now</span>
      </AffiliateLink>
    );
    
    const link = screen.getByRole('link');
    expect(link).toHaveTextContent('Buy Now');
    expect(link.querySelector('span')).toBeInTheDocument();
  });

  it('tracks affiliate click when clicked', () => {
    const mockTrackAffiliateClick = trackAffiliateClick as jest.MockedFunction<typeof trackAffiliateClick>;
    
    render(<AffiliateLink product={mockProduct} />);
    
    const link = screen.getByRole('link');
    fireEvent.click(link);
    
    expect(mockTrackAffiliateClick).toHaveBeenCalledWith(mockProduct);
  });

  it('calls custom onClick handler when provided', () => {
    const mockOnClick = jest.fn();
    
    render(<AffiliateLink product={mockProduct} onClick={mockOnClick} />);
    
    const link = screen.getByRole('link');
    fireEvent.click(link);
    
    expect(mockOnClick).toHaveBeenCalled();
  });

  it('displays disclosure by default', () => {
    render(<AffiliateLink product={mockProduct} />);
    
    const disclosure = screen.getByText('*');
    expect(disclosure).toHaveClass('affiliate-disclosure');
    expect(disclosure).toHaveClass('text-muted');
  });

  it('hides disclosure when showDisclosure is false', () => {
    render(<AffiliateLink product={mockProduct} showDisclosure={false} />);
    
    expect(screen.queryByText('*')).not.toBeInTheDocument();
  });

  it('displays custom disclosure text', () => {
    render(
      <AffiliateLink 
        product={mockProduct} 
        disclosureText="(affiliate)" 
      />
    );
    
    const disclosure = screen.getByText('(affiliate)');
    expect(disclosure).toBeInTheDocument();
  });

  it('applies custom CSS classes', () => {
    render(<AffiliateLink product={mockProduct} className="btn btn-primary" />);
    
    const link = screen.getByRole('link');
    expect(link).toHaveClass('affiliate-link');
    expect(link).toHaveClass('btn');
    expect(link).toHaveClass('btn-primary');
  });

  it('sets data attributes correctly', () => {
    render(<AffiliateLink product={mockProduct} />);
    
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('data-product-id', 'test-book-1');
    expect(link).toHaveAttribute('data-asin', 'B123456789');
  });

  it('allows custom target and rel attributes', () => {
    render(
      <AffiliateLink 
        product={mockProduct} 
        target="_self" 
        rel="noopener" 
      />
    );
    
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('target', '_self');
    expect(link).toHaveAttribute('rel', 'noopener');
  });

  it('forwards additional HTML attributes', () => {
    render(
      <AffiliateLink 
        product={mockProduct} 
        id="custom-link"
        data-testid="affiliate-link"
      />
    );
    
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('id', 'custom-link');
    expect(link).toHaveAttribute('data-testid', 'affiliate-link');
  });
});