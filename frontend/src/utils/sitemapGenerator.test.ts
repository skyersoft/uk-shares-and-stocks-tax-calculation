import { generateSitemap, SitemapEntry, SitemapConfig } from './sitemapGenerator';

const mockPages: SitemapEntry[] = [
  {
    url: '/calculator',
    changefreq: 'weekly',
    priority: 1.0,
    lastmod: '2024-09-15'
  },
  {
    url: '/results',
    changefreq: 'monthly',
    priority: 0.8,
    lastmod: '2024-09-10'
  },
  {
    url: '/blog',
    changefreq: 'daily',
    priority: 0.9,
    lastmod: '2024-09-16'
  },
  {
    url: '/about',
    changefreq: 'yearly',
    priority: 0.5,
    lastmod: '2024-01-01'
  }
];

const mockConfig: SitemapConfig = {
  hostname: 'https://example.com',
  defaultChangefreq: 'monthly',
  defaultPriority: 0.7
};

describe('generateSitemap', () => {
  it('generates basic XML sitemap', () => {
    const sitemap = generateSitemap(mockPages, mockConfig);
    
    expect(sitemap).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(sitemap).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(sitemap).toContain('</urlset>');
  });

  it('includes all provided URLs', () => {
    const sitemap = generateSitemap(mockPages, mockConfig);
    
    expect(sitemap).toContain('<loc>https://example.com/calculator</loc>');
    expect(sitemap).toContain('<loc>https://example.com/results</loc>');
    expect(sitemap).toContain('<loc>https://example.com/blog</loc>');
    expect(sitemap).toContain('<loc>https://example.com/about</loc>');
  });

  it('includes changefreq for each URL', () => {
    const sitemap = generateSitemap(mockPages, mockConfig);
    
    expect(sitemap).toContain('<changefreq>weekly</changefreq>');
    expect(sitemap).toContain('<changefreq>monthly</changefreq>');
    expect(sitemap).toContain('<changefreq>daily</changefreq>');
    expect(sitemap).toContain('<changefreq>yearly</changefreq>');
  });

  it('includes priority for each URL', () => {
    const sitemap = generateSitemap(mockPages, mockConfig);
    
    expect(sitemap).toContain('<priority>1.0</priority>');
    expect(sitemap).toContain('<priority>0.8</priority>');
    expect(sitemap).toContain('<priority>0.9</priority>');
    expect(sitemap).toContain('<priority>0.5</priority>');
  });

  it('includes lastmod dates', () => {
    const sitemap = generateSitemap(mockPages, mockConfig);
    
    expect(sitemap).toContain('<lastmod>2024-09-15</lastmod>');
    expect(sitemap).toContain('<lastmod>2024-09-10</lastmod>');
    expect(sitemap).toContain('<lastmod>2024-09-16</lastmod>');
    expect(sitemap).toContain('<lastmod>2024-01-01</lastmod>');
  });

  it('uses default values when not provided', () => {
    const pagesWithDefaults: SitemapEntry[] = [
      { url: '/test' }
    ];
    
    const sitemap = generateSitemap(pagesWithDefaults, mockConfig);
    
    expect(sitemap).toContain('<loc>https://example.com/test</loc>');
    expect(sitemap).toContain('<changefreq>monthly</changefreq>');
    expect(sitemap).toContain('<priority>0.7</priority>');
  });

  it('generates robots.txt content', () => {
    const robotsTxt = generateSitemap.generateRobotsTxt('https://example.com');
    
    expect(robotsTxt).toContain('User-agent: *');
    expect(robotsTxt).toContain('Allow: /');
    expect(robotsTxt).toContain('Sitemap: https://example.com/sitemap.xml');
  });

  it('handles empty pages array', () => {
    const sitemap = generateSitemap([], mockConfig);
    
    expect(sitemap).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(sitemap).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(sitemap).toContain('</urlset>');
  });

  it('properly escapes special characters in URLs', () => {
    const pagesWithSpecialChars: SitemapEntry[] = [
      { url: '/test?param=value&other=123' }
    ];
    
    const sitemap = generateSitemap(pagesWithSpecialChars, mockConfig);
    
    expect(sitemap).toContain('&amp;');
  });

  it('generates current timestamp when no lastmod provided', () => {
    const pagesWithoutLastmod: SitemapEntry[] = [
      { url: '/test' }
    ];
    
    const sitemap = generateSitemap(pagesWithoutLastmod, mockConfig);
    
    // Should contain a lastmod with current date
    const currentYear = new Date().getFullYear();
    expect(sitemap).toContain(`<lastmod>${currentYear}`);
  });

  it('validates URL format', () => {
    const invalidPages: SitemapEntry[] = [
      { url: 'invalid-url' }
    ];
    
    expect(() => generateSitemap(invalidPages, mockConfig)).not.toThrow();
    
    const sitemap = generateSitemap(invalidPages, mockConfig);
    expect(sitemap).toContain('<loc>https://example.com/invalid-url</loc>');
  });

  it('generates image sitemap entries when provided', () => {
    const pagesWithImages: SitemapEntry[] = [
      {
        url: '/blog/post-1',
        images: [
          {
            loc: 'https://example.com/images/post-1.jpg',
            title: 'Post 1 Image',
            caption: 'A great image for post 1'
          }
        ]
      }
    ];
    
    const sitemap = generateSitemap(pagesWithImages, mockConfig);
    
    expect(sitemap).toContain('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"');
    expect(sitemap).toContain('<image:image>');
    expect(sitemap).toContain('<image:loc>https://example.com/images/post-1.jpg</image:loc>');
    expect(sitemap).toContain('<image:title>Post 1 Image</image:title>');
    expect(sitemap).toContain('<image:caption>A great image for post 1</image:caption>');
  });
});