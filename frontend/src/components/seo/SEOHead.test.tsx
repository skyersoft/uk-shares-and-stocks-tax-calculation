import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SEOHead } from './SEOHead';

describe('SEOHead', () => {
  beforeEach(() => {
    // Clear any existing meta tags and reset title
    document.querySelectorAll('meta').forEach(meta => meta.remove());
    document.querySelectorAll('link[rel="canonical"]').forEach(link => link.remove());
    document.querySelectorAll('script[type="application/ld+json"]').forEach(script => script.remove());
    document.title = '';
  });

  afterEach(() => {
    // Clean up after each test
    document.querySelectorAll('meta').forEach(meta => meta.remove());
    document.querySelectorAll('link[rel="canonical"], link[rel="alternate"]').forEach(link => link.remove());
    document.querySelectorAll('script[type="application/ld+json"]').forEach(script => script.remove());
    document.title = '';
  });

  it('renders basic meta tags', () => {
    render(
      <SEOHead 
        title="Test Title"
        description="Test description"
      />
    );

    expect(document.title).toBe('Test Title | IBKR Tax Calculator');
    expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toBe('Test description');
    expect(document.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe('index,follow');
  });

  it('renders Open Graph meta tags', () => {
    render(
      <SEOHead 
        title="Test Title"
        description="Test description"
        ogImage="https://example.com/image.jpg"
        ogType="article"
      />
    );

    expect(document.querySelector('meta[property="og:title"]')?.getAttribute('content')).toBe('Test Title');
    expect(document.querySelector('meta[property="og:description"]')?.getAttribute('content')).toBe('Test description');
    expect(document.querySelector('meta[property="og:image"]')?.getAttribute('content')).toBe('https://example.com/image.jpg');
    expect(document.querySelector('meta[property="og:type"]')?.getAttribute('content')).toBe('article');
  });

  it('renders Twitter Card meta tags', () => {
    render(
      <SEOHead 
        title="Test Title"
        description="Test description"
        twitterCard="summary_large_image"
        twitterSite="@example"
      />
    );

    expect(document.querySelector('meta[name="twitter:card"]')?.getAttribute('content')).toBe('summary_large_image');
    expect(document.querySelector('meta[name="twitter:site"]')?.getAttribute('content')).toBe('@example');
  });

  it('renders canonical URL', () => {
    render(
      <SEOHead 
        title="Test Title"
        description="Test description"
        canonical="https://example.com/page"
      />
    );

    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe('https://example.com/page');
  });

  it('renders structured data', () => {
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": "Test Article",
      "author": "Test Author"
    };

    render(
      <SEOHead 
        title="Test Title"
        description="Test description"
        structuredData={structuredData}
      />
    );

    const script = document.querySelector('script[type="application/ld+json"]');
    expect(script).toBeTruthy();
    expect(script?.textContent).toContain('"@type":"Article"');
  });

  it('renders keywords meta tag', () => {
    const keywords = ['tax', 'calculator', 'uk'];

    render(
      <SEOHead 
        title="Test Title"
        description="Test description"
        keywords={keywords}
      />
    );

    expect(document.querySelector('meta[name="keywords"]')?.getAttribute('content')).toBe('tax,calculator,uk');
  });

  it('renders article meta tags', () => {
    render(
      <SEOHead 
        title="Test Title"
        description="Test description"
        articleAuthor="John Doe"
        articlePublishedTime="2024-09-15T10:00:00Z"
        articleModifiedTime="2024-09-16T10:00:00Z"
        articleSection="Tax Guides"
        articleTags={['tax', 'guide']}
      />
    );

    expect(document.querySelector('meta[property="article:author"]')?.getAttribute('content')).toBe('John Doe');
    expect(document.querySelector('meta[property="article:published_time"]')?.getAttribute('content')).toBe('2024-09-15T10:00:00Z');
    expect(document.querySelector('meta[property="article:modified_time"]')?.getAttribute('content')).toBe('2024-09-16T10:00:00Z');
    expect(document.querySelector('meta[property="article:section"]')?.getAttribute('content')).toBe('Tax Guides');
    
    const tagMetas = document.querySelectorAll('meta[property="article:tag"]');
    expect(tagMetas).toHaveLength(2);
    expect(tagMetas[0].getAttribute('content')).toBe('tax');
    expect(tagMetas[1].getAttribute('content')).toBe('guide');
  });

  it('renders robots meta tag', () => {
    render(
      <SEOHead 
        title="Test Title"
        description="Test description"
        robots="noindex,nofollow"
      />
    );

    expect(document.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe('noindex,nofollow');
  });

  it('renders language alternate links', () => {
    const alternateLanguages = [
      { lang: 'en', href: 'https://example.com/en' },
      { lang: 'fr', href: 'https://example.com/fr' }
    ];

    render(
      <SEOHead 
        title="Test Title"
        description="Test description"
        alternateLanguages={alternateLanguages}
      />
    );

    const alternateLinks = document.querySelectorAll('link[rel="alternate"][hreflang]');
    expect(alternateLinks).toHaveLength(2);
    
    const enLink = document.querySelector('link[hreflang="en"]');
    const frLink = document.querySelector('link[hreflang="fr"]');
    
    expect(enLink?.getAttribute('href')).toBe('https://example.com/en');
    expect(frLink?.getAttribute('href')).toBe('https://example.com/fr');
  });

  it('handles missing optional props gracefully', () => {
    render(
      <SEOHead 
        title="Test Title"
        description="Test description"
      />
    );

    expect(document.title).toBe('Test Title | IBKR Tax Calculator');
    expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toBe('Test description');
    expect(document.querySelector('meta[property="og:title"]')?.getAttribute('content')).toBe('Test Title');
    expect(document.querySelector('meta[name="twitter:title"]')?.getAttribute('content')).toBe('Test Title');
  });
});