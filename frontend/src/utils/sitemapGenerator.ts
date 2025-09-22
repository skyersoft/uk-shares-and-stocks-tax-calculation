export interface SitemapImage {
  loc: string;
  title?: string;
  caption?: string;
  geoLocation?: string;
  license?: string;
}

export interface SitemapEntry {
  url: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
  lastmod?: string;
  images?: SitemapImage[];
}

export interface SitemapConfig {
  hostname: string;
  defaultChangefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  defaultPriority?: number;
}

/**
 * Escapes special XML characters in a string
 */
const escapeXml = (str: string): string => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

/**
 * Ensures URL starts with / and normalizes it
 */
const normalizeUrl = (url: string): string => {
  if (!url.startsWith('/')) {
    return '/' + url;
  }
  return url;
};

/**
 * Generates current ISO date string for lastmod
 */
const getCurrentISODate = (): string => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Generates a sitemap entry for a single URL
 */
const generateSitemapEntry = (entry: SitemapEntry, config: SitemapConfig): string => {
  const {
    url,
    changefreq = config.defaultChangefreq || 'monthly',
    priority = config.defaultPriority || 0.7,
    lastmod = getCurrentISODate(),
    images = []
  } = entry;

  const normalizedUrl = normalizeUrl(url);
  const fullUrl = `${config.hostname}${normalizedUrl}`;

  let xml = '  <url>\n';
  xml += `    <loc>${escapeXml(fullUrl)}</loc>\n`;
  xml += `    <lastmod>${lastmod}</lastmod>\n`;
  xml += `    <changefreq>${changefreq}</changefreq>\n`;
  xml += `    <priority>${priority.toFixed(1)}</priority>\n`;

  // Add image entries if present
  if (images && images.length > 0) {
    images.forEach(image => {
      xml += '    <image:image>\n';
      xml += `      <image:loc>${escapeXml(image.loc)}</image:loc>\n`;
      if (image.title) {
        xml += `      <image:title>${escapeXml(image.title)}</image:title>\n`;
      }
      if (image.caption) {
        xml += `      <image:caption>${escapeXml(image.caption)}</image:caption>\n`;
      }
      if (image.geoLocation) {
        xml += `      <image:geo_location>${escapeXml(image.geoLocation)}</image:geo_location>\n`;
      }
      if (image.license) {
        xml += `      <image:license>${escapeXml(image.license)}</image:license>\n`;
      }
      xml += '    </image:image>\n';
    });
  }

  xml += '  </url>\n';
  return xml;
};

/**
 * Generates a complete XML sitemap from an array of entries
 */
export const generateSitemap = (entries: SitemapEntry[], config: SitemapConfig): string => {
  // Check if any entries have images to determine if we need image namespace
  const hasImages = entries.some(entry => entry.images && entry.images.length > 0);

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  
  if (hasImages) {
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
    xml += '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';
  } else {
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  }

  entries.forEach(entry => {
    xml += generateSitemapEntry(entry, config);
  });

  xml += '</urlset>\n';
  return xml;
};

/**
 * Generates robots.txt content with sitemap reference
 */
generateSitemap.generateRobotsTxt = (hostname: string, additionalRules?: string[]): string => {
  let robotsTxt = 'User-agent: *\n';
  robotsTxt += 'Allow: /\n';
  
  if (additionalRules && additionalRules.length > 0) {
    robotsTxt += '\n';
    robotsTxt += additionalRules.join('\n') + '\n';
  }
  
  robotsTxt += '\n';
  robotsTxt += `Sitemap: ${hostname}/sitemap.xml\n`;
  
  return robotsTxt;
};

/**
 * Discovers pages from a React Router configuration or similar
 */
export const discoverPages = (routes: any[]): SitemapEntry[] => {
  const pages: SitemapEntry[] = [];

  const processRoute = (route: any, basePath = '') => {
    if (route.path && route.path !== '*') {
      const fullPath = basePath + route.path;
      
      // Determine priority based on route characteristics
      let priority = 0.5;
      if (fullPath === '/' || fullPath === '/calculator') priority = 1.0;
      else if (fullPath.includes('/blog')) priority = 0.8;
      else if (fullPath.includes('/results')) priority = 0.9;
      else if (fullPath.includes('/about') || fullPath.includes('/help')) priority = 0.6;

      // Determine change frequency
      let changefreq: SitemapEntry['changefreq'] = 'monthly';
      if (fullPath.includes('/blog')) changefreq = 'weekly';
      else if (fullPath === '/calculator') changefreq = 'weekly';
      else if (fullPath.includes('/about') || fullPath.includes('/privacy') || fullPath.includes('/terms')) {
        changefreq = 'yearly';
      }

      pages.push({
        url: fullPath,
        priority,
        changefreq
      });
    }

    // Process child routes recursively
    if (route.children) {
      route.children.forEach((child: any) => {
        processRoute(child, basePath + (route.path || ''));
      });
    }
  };

  routes.forEach(route => processRoute(route));
  return pages;
};

/**
 * Static page configuration for IBKR Tax Calculator
 */
export const getStaticPages = (): SitemapEntry[] => {
  return [
    {
      url: '/',
      changefreq: 'weekly',
      priority: 1.0
    },
    {
      url: '/calculator',
      changefreq: 'weekly',
      priority: 1.0
    },
    {
      url: '/results',
      changefreq: 'monthly',
      priority: 0.9
    },
    {
      url: '/blog',
      changefreq: 'daily',
      priority: 0.8
    },
    {
      url: '/about',
      changefreq: 'yearly',
      priority: 0.6
    },
    {
      url: '/help',
      changefreq: 'monthly',
      priority: 0.7
    },
    {
      url: '/privacy',
      changefreq: 'yearly',
      priority: 0.3
    },
    {
      url: '/terms',
      changefreq: 'yearly',
      priority: 0.3
    },
    {
      url: '/cgt-guide',
      changefreq: 'monthly',
      priority: 0.8
    }
  ];
};

/**
 * Generates blog post sitemap entries from blog data
 */
export const generateBlogSitemapEntries = (blogPosts: any[]): SitemapEntry[] => {
  return blogPosts.map(post => ({
    url: `/blog/${post.slug || post.id}`,
    changefreq: 'monthly' as const,
    priority: 0.7,
    lastmod: post.updatedAt || post.publishedDate,
    images: post.featuredImage ? [{
      loc: post.featuredImage,
      title: post.title,
      caption: post.excerpt
    }] : undefined
  }));
};

export default generateSitemap;