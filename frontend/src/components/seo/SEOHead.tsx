import React, { useEffect } from 'react';

interface AlternateLanguage {
  lang: string;
  href: string;
}

interface SEOHeadProps {
  title: string;
  description: string;
  keywords?: string[];
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  ogUrl?: string;
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
  twitterSite?: string;
  twitterCreator?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  articleAuthor?: string;
  articlePublishedTime?: string;
  articleModifiedTime?: string;
  articleSection?: string;
  articleTags?: string[];
  robots?: string;
  alternateLanguages?: AlternateLanguage[];
  structuredData?: object;
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description,
  keywords,
  canonical,
  ogTitle,
  ogDescription,
  ogImage,
  ogType = 'website',
  ogUrl,
  twitterCard = 'summary',
  twitterSite,
  twitterCreator,
  twitterTitle,
  twitterDescription,
  twitterImage,
  articleAuthor,
  articlePublishedTime,
  articleModifiedTime,
  articleSection,
  articleTags,
  robots = 'index,follow',
  alternateLanguages,
  structuredData
}) => {
  useEffect(() => {
    const fullTitle = title.includes('IBKR Tax Calculator') 
      ? title 
      : `${title} | IBKR Tax Calculator`;

    // Update document title
    document.title = fullTitle;

    // Helper function to update or create meta tag
    const updateMetaTag = (name: string, content: string, isProperty = false) => {
      const attribute = isProperty ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attribute, name);
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    // Helper function to update or create link tag
    const updateLinkTag = (rel: string, href: string, additionalAttrs?: Record<string, string>) => {
      let link = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = rel;
        document.head.appendChild(link);
      }
      link.href = href;
      if (additionalAttrs) {
        Object.entries(additionalAttrs).forEach(([key, value]) => {
          link.setAttribute(key, value);
        });
      }
    };

    // Basic meta tags
    updateMetaTag('description', description);
    updateMetaTag('robots', robots);
    if (keywords && keywords.length > 0) {
      updateMetaTag('keywords', keywords.join(','));
    }

    // Open Graph tags
    updateMetaTag('og:title', ogTitle || title, true);
    updateMetaTag('og:description', ogDescription || description, true);
    updateMetaTag('og:type', ogType, true);
    updateMetaTag('og:site_name', 'IBKR Tax Calculator', true);
    updateMetaTag('og:locale', 'en_GB', true);
    
    if (ogUrl) updateMetaTag('og:url', ogUrl, true);
    if (ogImage) updateMetaTag('og:image', ogImage, true);

    // Twitter Card tags
    updateMetaTag('twitter:card', twitterCard);
    updateMetaTag('twitter:title', twitterTitle || title);
    updateMetaTag('twitter:description', twitterDescription || description);
    
    if (twitterSite) updateMetaTag('twitter:site', twitterSite);
    if (twitterCreator) updateMetaTag('twitter:creator', twitterCreator);
    if (twitterImage) updateMetaTag('twitter:image', twitterImage);

    // Article tags
    if (articleAuthor) updateMetaTag('article:author', articleAuthor, true);
    if (articlePublishedTime) updateMetaTag('article:published_time', articlePublishedTime, true);
    if (articleModifiedTime) updateMetaTag('article:modified_time', articleModifiedTime, true);
    if (articleSection) updateMetaTag('article:section', articleSection, true);

    // Article tags (multiple)
    if (articleTags) {
      // Remove existing article:tag metas
      document.querySelectorAll('meta[property="article:tag"]').forEach(meta => meta.remove());
      // Add new ones
      articleTags.forEach(tag => {
        const meta = document.createElement('meta');
        meta.setAttribute('property', 'article:tag');
        meta.content = tag;
        document.head.appendChild(meta);
      });
    }

    // Canonical URL
    if (canonical) {
      updateLinkTag('canonical', canonical);
    }

    // Alternate languages
    if (alternateLanguages) {
      // Remove existing alternate links
      document.querySelectorAll('link[rel="alternate"][hreflang]').forEach(link => link.remove());
      // Add new ones - create them directly to avoid conflicts
      alternateLanguages.forEach(({ lang, href }) => {
        const link = document.createElement('link');
        link.rel = 'alternate';
        link.hreflang = lang;
        link.href = href;
        document.head.appendChild(link);
      });
    }

    // Structured data
    if (structuredData) {
      let script = document.querySelector('script[type="application/ld+json"]') as HTMLScriptElement;
      if (!script) {
        script = document.createElement('script');
        script.type = 'application/ld+json';
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(structuredData);
    }

    // Cleanup function to reset title when component unmounts
    return () => {
      document.title = 'IBKR Tax Calculator';
    };
  }, [
    title, description, keywords, canonical, ogTitle, ogDescription, ogImage, ogType, ogUrl,
    twitterCard, twitterSite, twitterCreator, twitterTitle, twitterDescription, twitterImage,
    articleAuthor, articlePublishedTime, articleModifiedTime, articleSection, articleTags,
    robots, alternateLanguages, structuredData
  ]);

  // This component doesn't render anything visible
  return null;
};

export default SEOHead;