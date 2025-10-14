import { test, expect } from '@playwright/test';
import { BasePage, BlogPage } from './helpers/page-objects';

test.describe('Content & SEO Tests', () => {
  test.describe('Static Pages Content', () => {
    test('About page should have comprehensive content', async ({ page }) => {
      const aboutPage = new BasePage(page);
      await aboutPage.goto('about');
      await aboutPage.waitForPageLoad();

      // Check page title and meta tags
      await aboutPage.checkSEOTags();
      
      // Check essential content sections
      const contentSections = [
        'Mission',
        'Features', 
        'Team',
        'Technology',
        'Contact'
      ];

      for (const section of contentSections) {
        const sectionElement = page.locator(`h2:has-text("${section}"), h3:has-text("${section}"), :has-text("${section}")`);
        if (await sectionElement.count() > 0) {
          await expect(sectionElement.first()).toBeVisible();
        }
      }

      // Check for FAQ section if present
      const faqAccordion = page.locator('.accordion, [data-testid="faq"]');
      if (await faqAccordion.count() > 0) {
        await expect(faqAccordion).toBeVisible();
        
        // Test accordion functionality
        const accordionItems = faqAccordion.locator('.accordion-item, .faq-item');
        const itemCount = await accordionItems.count();
        
        if (itemCount > 0) {
          const firstItem = accordionItems.first();
          const toggleButton = firstItem.locator('button, .accordion-toggle');
          
          if (await toggleButton.count() > 0) {
            await toggleButton.click();
            const content = firstItem.locator('.accordion-content, .faq-answer');
            await expect(content).toBeVisible();
          }
        }
      }

      // Check for version information
      const versionInfo = page.locator(':has-text("Version"), :has-text("v1."), :has-text("Updated")');
      if (await versionInfo.count() > 0) {
        await expect(versionInfo.first()).toBeVisible();
      }
    });

    test('Help page should provide comprehensive assistance', async ({ page }) => {
      const helpPage = new BasePage(page);
      await helpPage.goto('help');
      await helpPage.waitForPageLoad();

      await helpPage.checkSEOTags();

      // Check for search functionality
      const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]');
      if (await searchInput.count() > 0) {
        await expect(searchInput).toBeVisible();
        
        // Test search functionality
        await searchInput.fill('capital gains');
        await searchInput.press('Enter');
        await helpPage.waitForPageLoad();
        
        // Should show search results
        const searchResults = page.locator('.search-results, [data-testid="search-results"]');
        if (await searchResults.count() > 0) {
          await expect(searchResults).toBeVisible();
        }
      }

      // Check for FAQ sections
      const faqSections = page.locator('.faq-section, .help-section');
      const sectionCount = await faqSections.count();
      expect(sectionCount).toBeGreaterThan(0);

      // Check essential help topics
      const helpTopics = [
        'Getting Started',
        'File Format',
        'Calculation',
        'Tax Information',
        'Troubleshooting',
        'Contact Support'
      ];

      let foundTopics = 0;
      for (const topic of helpTopics) {
        const topicElement = page.locator(`:has-text("${topic}")`);
        if (await topicElement.count() > 0) {
          foundTopics++;
        }
      }
      expect(foundTopics).toBeGreaterThan(3); // At least 4 topics should be present

      // Check for quick links
      const quickLinks = page.locator('.quick-links, .help-links');
      if (await quickLinks.count() > 0) {
        await expect(quickLinks).toBeVisible();
      }
    });

    test('Privacy Policy should be comprehensive and legal', async ({ page }) => {
      const privacyPage = new BasePage(page);
      await privacyPage.goto('privacy');
      await privacyPage.waitForPageLoad();

      await privacyPage.checkSEOTags();

      // Check essential privacy policy sections
      const privacySections = [
        'Data Collection',
        'Data Usage', 
        'Data Security',
        'User Rights',
        'Cookies',
        'Third Parties',
        'Contact Information'
      ];

      let foundSections = 0;
      for (const section of privacySections) {
        const sectionElement = page.locator(`:has-text("${section}")`);
        if (await sectionElement.count() > 0) {
          foundSections++;
        }
      }
      expect(foundSections).toBeGreaterThan(4); // At least 5 sections

      // Check for effective date
      const effectiveDate = page.locator(':has-text("Effective Date"), :has-text("Last Updated"), :has-text("2024"), :has-text("2025")');
      await expect(effectiveDate.first()).toBeVisible();

      // Check for GDPR compliance mentions
      const gdprMentions = page.locator(':has-text("GDPR"), :has-text("General Data Protection")');
      if (await gdprMentions.count() > 0) {
        await expect(gdprMentions.first()).toBeVisible();
      }

      // Check content length (should be substantial)
      const mainContent = page.locator('main, .content, .privacy-content');
      const contentText = await mainContent.textContent();
      expect(contentText!.length).toBeGreaterThan(2000); // Substantial privacy policy
    });

    test('Terms of Service should be comprehensive', async ({ page }) => {
      const termsPage = new BasePage(page);
      await termsPage.goto('terms');
      await termsPage.waitForPageLoad();

      await termsPage.checkSEOTags();

      // Check essential terms sections
      const termsSections = [
        'Service Description',
        'User Responsibilities',
        'Disclaimers',
        'Limitation of Liability',
        'Intellectual Property',
        'Termination',
        'Governing Law'
      ];

      let foundSections = 0;
      for (const section of termsSections) {
        const sectionElement = page.locator(`:has-text("${section}")`);
        if (await sectionElement.count() > 0) {
          foundSections++;
        }
      }
      expect(foundSections).toBeGreaterThan(4);

      // Check for effective date
      const effectiveDate = page.locator(':has-text("Effective Date"), :has-text("Last Updated")');
      await expect(effectiveDate.first()).toBeVisible();

      // Check for tax disclaimer (important for tax calculation tool)
      const taxDisclaimer = page.locator(':has-text("tax advice"), :has-text("professional advice"), :has-text("disclaimer")');
      await expect(taxDisclaimer.first()).toBeVisible();

      // Check content length
      const mainContent = page.locator('main, .content, .terms-content');
      const contentText = await mainContent.textContent();
      expect(contentText!.length).toBeGreaterThan(1500);
    });
  });

  test.describe('Blog Content', () => {
    test('Blog page should display posts with proper structure', async ({ page }) => {
      const blogPage = new BlogPage(page);
      await blogPage.goto('blog');
      await blogPage.waitForPageLoad();

      await blogPage.checkSEOTags();
      await blogPage.checkBlogPostStructure();

      // Check for blog navigation elements
      const blogNav = page.locator('.blog-nav, .post-nav, [data-testid="blog-navigation"]');
      if (await blogNav.count() > 0) {
        await expect(blogNav).toBeVisible();
      }

      // Check for categories if present
      const categories = page.locator('.categories, .blog-categories, [data-testid="categories"]');
      if (await categories.count() > 0) {
        await expect(categories).toBeVisible();
        
        const categoryLinks = categories.locator('a');
        const categoryCount = await categoryLinks.count();
        if (categoryCount > 0) {
          // Test category filtering
          await categoryLinks.first().click();
          await blogPage.waitForPageLoad();
          
          // Should still show blog posts
          const filteredPosts = page.locator('[data-testid="blog-post"], .blog-post');
          if (await filteredPosts.count() > 0) {
            await expect(filteredPosts.first()).toBeVisible();
          }
        }
      }
    });

    test('Blog search functionality should work', async ({ page }) => {
      const blogPage = new BlogPage(page);
      await blogPage.goto('blog');
      await blogPage.waitForPageLoad();

      // Test search if available
      if (await blogPage.searchInput.count() > 0) {
        await blogPage.searchBlog('tax');
        
        // Should display search results
        const searchResults = page.locator('.search-results, [data-testid="search-results"]');
        if (await searchResults.count() > 0) {
          await expect(searchResults).toBeVisible();
        }

        // Test no results scenario
        await blogPage.searchBlog('xyz123nonexistent');
        
        const noResults = page.locator(':has-text("No results"), :has-text("not found"), .no-results');
        if (await noResults.count() > 0) {
          await expect(noResults.first()).toBeVisible();
        }
      }
    });

    test('Individual blog posts should have proper structure', async ({ page }) => {
      const blogPage = new BlogPage(page);
      await blogPage.goto('blog');
      await blogPage.waitForPageLoad();

      // Find and click on first blog post
      const firstPost = blogPage.blogPosts.first();
      if (await firstPost.count() > 0) {
        const postLink = firstPost.locator('a');
        if (await postLink.count() > 0) {
          await postLink.first().click();
          await blogPage.waitForPageLoad();

          // Check blog post structure
          await expect(page.locator('h1')).toBeVisible(); // Post title
          
          // Check for meta information
          const metaInfo = page.locator('.post-meta, .article-meta, [data-testid="post-meta"]');
          if (await metaInfo.count() > 0) {
            await expect(metaInfo).toBeVisible();
          }

          // Check for author information
          const authorInfo = page.locator('.author, [data-testid="author"]');
          if (await authorInfo.count() > 0) {
            await expect(authorInfo).toBeVisible();
          }

          // Check for publication date
          const dateInfo = page.locator('.date, .published, [data-testid="publish-date"]');
          if (await dateInfo.count() > 0) {
            await expect(dateInfo).toBeVisible();
          }

          // Check for substantial content
          const content = page.locator('.post-content, .article-content, main');
          const contentText = await content.textContent();
          expect(contentText!.length).toBeGreaterThan(500);

          // Check for related posts or navigation
          const relatedPosts = page.locator('.related-posts, .post-navigation');
          if (await relatedPosts.count() > 0) {
            await expect(relatedPosts).toBeVisible();
          }
        }
      }
    });

    test('Blog should have RSS feed or sitemap', async ({ page }) => {
      // Check for RSS feed link
      const rssLink = page.locator('link[type="application/rss+xml"], a[href*="rss"], a[href*="feed"]');
      if (await rssLink.count() > 0) {
        const href = await rssLink.first().getAttribute('href');
        expect(href).toBeTruthy();
      }

      // Check sitemap exists
      const sitemapResponse = await page.request.get('/sitemap.xml');
      if (sitemapResponse.ok()) {
        const sitemapContent = await sitemapResponse.text();
        expect(sitemapContent).toContain('<urlset');
        expect(sitemapContent).toContain('<url>');
      }
    });
  });

  test.describe('SEO Optimization', () => {
    const testPages = [
      { path: '', name: 'Home' },
      { path: 'calculator', name: 'Calculator' },
      { path: 'about', name: 'About' },
      { path: 'help', name: 'Help' },
      { path: 'blog', name: 'Blog' },
      { path: 'privacy', name: 'Privacy' },
      { path: 'terms', name: 'Terms' }
    ];

    test('All pages should have unique and descriptive titles', async ({ page }) => {
      const pageTitles = new Set();

      for (const testPage of testPages) {
        await page.goto(`/${testPage.path}`);
        await page.waitForLoadState('networkidle');

        const title = await page.title();
        expect(title).toBeTruthy();
        expect(title.length).toBeGreaterThan(10);
        expect(title.length).toBeLessThan(60); // SEO best practice
        
        // Titles should be unique
        expect(pageTitles.has(title)).toBeFalsy();
        pageTitles.add(title);

        // Title should be relevant to page
        const lowerTitle = title.toLowerCase();
        const lowerPath = testPage.name.toLowerCase();
        
        if (testPage.path !== '') { // Skip home page check
          expect(lowerTitle.includes(lowerPath) || lowerTitle.includes('tax') || lowerTitle.includes('calculator')).toBeTruthy();
        }
      }
    });

    test('All pages should have meta descriptions', async ({ page }) => {
      for (const testPage of testPages) {
        await page.goto(`/${testPage.path}`);
        await page.waitForLoadState('networkidle');

        const description = await page.locator('meta[name="description"]').getAttribute('content');
        expect(description).toBeTruthy();
        expect(description!.length).toBeGreaterThan(120);
        expect(description!.length).toBeLessThan(160); // SEO best practice
      }
    });

    test('All pages should have Open Graph tags', async ({ page }) => {
      for (const testPage of testPages) {
        await page.goto(`/${testPage.path}`);
        await page.waitForLoadState('networkidle');

        // Check essential Open Graph tags
        const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
        expect(ogTitle).toBeTruthy();

        const ogDescription = await page.locator('meta[property="og:description"]').getAttribute('content');
        expect(ogDescription).toBeTruthy();

        const ogType = await page.locator('meta[property="og:type"]').getAttribute('content');
        expect(ogType).toBeTruthy();

        const ogUrl = await page.locator('meta[property="og:url"]').getAttribute('content');
        if (ogUrl) {
          expect(ogUrl).toMatch(/^https?:\/\//);
        }
      }
    });

    test('All pages should have Twitter Card tags', async ({ page }) => {
      for (const testPage of testPages) {
        await page.goto(`/${testPage.path}`);
        await page.waitForLoadState('networkidle');

        const twitterCard = await page.locator('meta[name="twitter:card"]').getAttribute('content');
        if (twitterCard) {
          expect(['summary', 'summary_large_image']).toContain(twitterCard);
        }

        const twitterTitle = await page.locator('meta[name="twitter:title"]').getAttribute('content');
        if (twitterTitle) {
          expect(twitterTitle).toBeTruthy();
        }
      }
    });

    test('Pages should have proper canonical URLs', async ({ page }) => {
      for (const testPage of testPages) {
        await page.goto(`/${testPage.path}`);
        await page.waitForLoadState('networkidle');

        const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
        expect(canonical).toBeTruthy();
        expect(canonical).toMatch(/^https?:\/\//);
        
        // Canonical should end with current path
        if (testPage.path) {
          expect(canonical!.endsWith(testPage.path)).toBeTruthy();
        }
      }
    });

    test('Site should have structured data markup', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Check for JSON-LD structured data
      const structuredData = page.locator('script[type="application/ld+json"]');
      const count = await structuredData.count();

      if (count > 0) {
        for (let i = 0; i < count; i++) {
          const jsonContent = await structuredData.nth(i).textContent();
          expect(jsonContent).toBeTruthy();
          
          // Should be valid JSON
          const parsedData = JSON.parse(jsonContent!);
          expect(parsedData['@context']).toBeTruthy();
          expect(parsedData['@type']).toBeTruthy();

          // Common structured data types for financial sites
          const validTypes = ['WebSite', 'Organization', 'SoftwareApplication', 'Article', 'BlogPosting'];
          if (typeof parsedData['@type'] === 'string') {
            expect(validTypes).toContain(parsedData['@type']);
          }
        }
      }
    });

    test('Site should have robots.txt', async ({ page }) => {
      const robotsResponse = await page.request.get('/robots.txt');
      expect(robotsResponse.ok()).toBeTruthy();

      const robotsContent = await robotsResponse.text();
      expect(robotsContent).toContain('User-agent:');
      
      // Should allow search engines for main content
      expect(robotsContent).toMatch(/Allow:|Disallow:/);
      
      // Should reference sitemap
      expect(robotsContent).toContain('Sitemap:');
    });

    test('Site should have XML sitemap', async ({ page }) => {
      const sitemapResponse = await page.request.get('/sitemap.xml');
      expect(sitemapResponse.ok()).toBeTruthy();

      const sitemapContent = await sitemapResponse.text();
      expect(sitemapContent).toContain('<?xml');
      expect(sitemapContent).toContain('<urlset');
      expect(sitemapContent).toContain('<url>');
      expect(sitemapContent).toContain('<loc>');

      // Should include main pages
      for (const testPage of testPages) {
        if (testPage.path === '') continue; // Skip home page format
        expect(sitemapContent).toContain(testPage.path);
      }
    });

    test('Images should have alt text and proper optimization', async ({ page }) => {
      for (const testPage of testPages) {
        await page.goto(`/${testPage.path}`);
        await page.waitForLoadState('networkidle');

        const images = page.locator('img');
        const imageCount = await images.count();

        for (let i = 0; i < imageCount; i++) {
          const img = images.nth(i);
          
          // Check alt text
          const alt = await img.getAttribute('alt');
          expect(alt).not.toBeNull(); // Alt can be empty for decorative images

          // Check loading attribute for performance
          const loading = await img.getAttribute('loading');
          if (loading) {
            expect(['lazy', 'eager']).toContain(loading);
          }

          // Check if image has proper dimensions
          const width = await img.getAttribute('width');
          const height = await img.getAttribute('height');
          
          if (width && height) {
            expect(parseInt(width)).toBeGreaterThan(0);
            expect(parseInt(height)).toBeGreaterThan(0);
          }
        }
      }
    });
  });

  test.describe('Content Quality', () => {
    test('Content should be well-structured with proper headings', async ({ page }) => {
      const contentPages = ['about', 'help', 'privacy', 'terms'];

      for (const pagePath of contentPages) {
        await page.goto(`/${pagePath}`);
        await page.waitForLoadState('networkidle');

        // Check heading hierarchy
        const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
        expect(headings.length).toBeGreaterThan(1);

        const headingLevels = await Promise.all(
          headings.map(async (heading) => {
            const tagName = await heading.evaluate(el => el.tagName.toLowerCase());
            return parseInt(tagName.substring(1));
          })
        );

        // Should start with h1
        expect(headingLevels[0]).toBe(1);

        // Check no levels are skipped
        for (let i = 1; i < headingLevels.length; i++) {
          const diff = headingLevels[i] - headingLevels[i - 1];
          expect(diff).toBeLessThanOrEqual(1);
        }
      }
    });

    test('Content should have adequate text-to-HTML ratio', async ({ page }) => {
      const contentPages = ['about', 'help', 'privacy', 'terms'];

      for (const pagePath of contentPages) {
        await page.goto(`/${pagePath}`);
        await page.waitForLoadState('networkidle');

        const textContent = await page.locator('main, .content').textContent();
        const htmlContent = await page.locator('main, .content').innerHTML();

        const textLength = textContent!.replace(/\s+/g, ' ').trim().length;
        const htmlLength = htmlContent!.length;

        // Text should be at least 30% of HTML (good content-to-markup ratio)
        const ratio = textLength / htmlLength;
        expect(ratio).toBeGreaterThan(0.3);
        
        // Content should be substantial
        expect(textLength).toBeGreaterThan(500);
      }
    });

    test('Links should be descriptive and work correctly', async ({ page }) => {
      const testPages = ['', 'about', 'help', 'blog'];

      for (const pagePath of testPages) {
        await page.goto(`/${pagePath}`);
        await page.waitForLoadState('networkidle');

        const links = page.locator('a[href]');
        const linkCount = await links.count();

        for (let i = 0; i < Math.min(linkCount, 10); i++) { // Test first 10 links
          const link = links.nth(i);
          const href = await link.getAttribute('href');
          const linkText = await link.textContent();

          // Skip empty links or anchors
          if (!href || href.startsWith('#') || href.startsWith('javascript:')) continue;

          // Link text should be descriptive
          expect(linkText!.trim().length).toBeGreaterThan(2);
          
          // Avoid generic link text
          const genericTexts = ['click here', 'read more', 'here', 'more'];
          const isGeneric = genericTexts.some(generic => 
            linkText!.toLowerCase().trim() === generic
          );
          
          if (isGeneric) {
            // Generic text is okay if there's additional context (aria-label, title, etc.)
            const ariaLabel = await link.getAttribute('aria-label');
            const title = await link.getAttribute('title');
            expect(ariaLabel || title).toBeTruthy();
          }

          // External links should have proper attributes
          if (href!.startsWith('http') && !href!.includes(page.url().split('/')[2])) {
            const target = await link.getAttribute('target');
            const rel = await link.getAttribute('rel');
            
            expect(target).toBe('_blank');
            expect(rel).toContain('noopener');
          }
        }
      }
    });
  });
});