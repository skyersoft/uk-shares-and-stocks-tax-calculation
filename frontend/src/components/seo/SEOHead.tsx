import React from 'react';
import { Head as Helmet } from 'vite-react-ssg';
import { useInRouterContext, useLocation } from 'react-router-dom';

const SITE_URL = 'https://cgttaxtool.uk';

// Canonical URLs have no trailing slash (CloudFront 301s /x/ and /x/index.html to /x).
const RouteCanonical: React.FC = () => {
  const { pathname } = useLocation();
  const path = pathname.replace(/(\/index\.html)?\/*$/, '') || '/';
  return (
    <Helmet>
      <link rel="canonical" href={`${SITE_URL}${path}`} />
    </Helmet>
  );
};

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
  const inRouter = useInRouterContext();
  const fullTitle = title.includes('UK Stock Tax Calculator')
    ? title
    : `${title} | UK Stock Tax Calculator`;

  return (
    <>
    {!canonical && inRouter && robots.startsWith('index') && <RouteCanonical />}
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={robots} />
      {keywords && keywords.length > 0 && (
        <meta name="keywords" content={keywords.join(',')} />
      )}

      {/* Open Graph Tags */}
      <meta property="og:title" content={ogTitle || title} />
      <meta property="og:description" content={ogDescription || description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content="UK Stock Tax Calculator" />
      <meta property="og:locale" content="en_GB" />
      {ogUrl && <meta property="og:url" content={ogUrl} />}
      {ogImage && <meta property="og:image" content={ogImage} />}

      {/* Twitter Card Tags */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={twitterTitle || title} />
      <meta name="twitter:description" content={twitterDescription || description} />
      {twitterSite && <meta name="twitter:site" content={twitterSite} />}
      {twitterCreator && <meta name="twitter:creator" content={twitterCreator} />}
      {twitterImage && <meta name="twitter:image" content={twitterImage} />}

      {/* Article Tags */}
      {articleAuthor && <meta property="article:author" content={articleAuthor} />}
      {articlePublishedTime && <meta property="article:published_time" content={articlePublishedTime} />}
      {articleModifiedTime && <meta property="article:modified_time" content={articleModifiedTime} />}
      {articleSection && <meta property="article:section" content={articleSection} />}
      {articleTags && articleTags.map(tag => (
        <meta key={tag} property="article:tag" content={tag} />
      ))}

      {/* Canonical URL */}
      {canonical && <link rel="canonical" href={canonical} />}

      {/* Alternate Languages */}
      {alternateLanguages && alternateLanguages.map(({ lang, href }) => (
        <link key={lang} rel="alternate" hrefLang={lang} href={href} />
      ))}

      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
    </>
  );
};

export default SEOHead;