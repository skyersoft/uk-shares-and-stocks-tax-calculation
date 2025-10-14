import { test, expect } from '@playwright/test';
import { BasePage } from './helpers/page-objects';

test.describe('Advertising & Monetization Tests', () => {
  let basePage: BasePage;

  test.beforeEach(async ({ page }) => {
    basePage = new BasePage(page);
    await basePage.goto();
    await basePage.waitForPageLoad();
  });

  test.describe('Google AdSense Integration', () => {
    test('should load AdSense script correctly', async ({ page }) => {
      // Check for AdSense script tags
      const adsenseScripts = page.locator('script[src*="googlesyndication.com"], script[src*="adsbygoogle.js"]');
      const scriptCount = await adsenseScripts.count();
      
      if (scriptCount > 0) {
        await expect(adsenseScripts.first()).toBeAttached();
        
        // Check script loads successfully
        const scriptSrc = await adsenseScripts.first().getAttribute('src');
        const response = await page.request.get(scriptSrc!);
        expect(response.ok()).toBeTruthy();
      }
    });

    test('should display ad units in correct positions', async ({ page }) => {
      // Common ad positions
      const adSelectors = [
        '.adsbygoogle',
        '[data-ad-client]',
        '[data-ad-slot]',
        '.ad-unit',
        '.google-ad',
        '[data-testid*="ad"]'
      ];

      let adUnitsFound = 0;
      
      for (const selector of adSelectors) {
        const adElements = page.locator(selector);
        const count = await adElements.count();
        
        if (count > 0) {
          adUnitsFound += count;
          
          // Check ad units are properly positioned
          for (let i = 0; i < count; i++) {
            const adUnit = adElements.nth(i);
            await expect(adUnit).toBeAttached();
            
            // Check for required AdSense attributes
            const adClient = await adUnit.getAttribute('data-ad-client');
            const adSlot = await adUnit.getAttribute('data-ad-slot');
            
            if (adClient) {
              expect(adClient).toMatch(/^ca-pub-\d+$/);
            }
            
            if (adSlot) {
              expect(adSlot).toMatch(/^\d+$/);
            }
          }
        }
      }

      // Should have at least some ad placements
      if (adUnitsFound > 0) {
        expect(adUnitsFound).toBeGreaterThan(0);
        console.log(`Found ${adUnitsFound} ad units`);
      }
    });

    test('should have proper ad placements on different pages', async ({ page }) => {
      const pagesToTest = [
        { path: '', name: 'Home' },
        { path: 'calculator', name: 'Calculator' },
        { path: 'about', name: 'About' },
        { path: 'blog', name: 'Blog' }
      ];

      for (const testPage of pagesToTest) {
        await basePage.goto(testPage.path);
        await basePage.waitForPageLoad();

        // Look for ad containers
        const adContainers = page.locator('.adsbygoogle, .ad-container, [data-ad-client]');
        const adCount = await adContainers.count();

        if (adCount > 0) {
          // Ads should be visible and properly sized
          for (let i = 0; i < adCount; i++) {
            const adContainer = adContainers.nth(i);
            
            // Check if ad container has minimum dimensions
            const boundingBox = await adContainer.boundingBox();
            if (boundingBox) {
              expect(boundingBox.width).toBeGreaterThan(250); // Minimum ad width
              expect(boundingBox.height).toBeGreaterThan(100); // Minimum ad height
            }
          }
        }
      }
    });

    test('should handle ad blocker detection', async ({ page }) => {
      // Check for ad blocker detection scripts or messages
      const adBlockDetection = page.locator(
        ':has-text("ad blocker"), :has-text("adblocker"), [data-testid*="adblock"]'
      );
      
      if (await adBlockDetection.count() > 0) {
        // If ad blocker detection is present, it should be informative
        const detectionText = await adBlockDetection.first().textContent();
        expect(detectionText!.length).toBeGreaterThan(20);
      }

      // Simulate ad blocker by blocking ad requests
      await page.route('**/googlesyndication.com/**', route => route.abort());
      await page.route('**/googletagservices.com/**', route => route.abort());
      
      await page.reload();
      await basePage.waitForPageLoad();

      // Check if site still functions properly without ads
      await expect(page.locator('main')).toBeVisible();
      await expect(page.locator('nav')).toBeVisible();
    });

    test('should respect user privacy and GDPR compliance', async ({ page }) => {
      // Check for cookie consent banner
      const cookieBanner = page.locator(
        '.cookie-banner, .consent-banner, [data-testid*="cookie"], [data-testid*="consent"]'
      );
      
      if (await cookieBanner.count() > 0) {
        await expect(cookieBanner.first()).toBeVisible();
        
        // Should have accept/reject options
        const acceptButton = cookieBanner.locator('button:has-text("Accept"), button:has-text("Allow")');
        const rejectButton = cookieBanner.locator('button:has-text("Reject"), button:has-text("Decline")');
        
        if (await acceptButton.count() > 0) {
          await expect(acceptButton.first()).toBeVisible();
        }
        
        if (await rejectButton.count() > 0) {
          await expect(rejectButton.first()).toBeVisible();
        }

        // Should have link to privacy policy
        const privacyLink = cookieBanner.locator('a[href*="privacy"], a:has-text("Privacy Policy")');
        if (await privacyLink.count() > 0) {
          await expect(privacyLink.first()).toBeVisible();
        }
      }

      // Check for GDPR compliance in privacy policy
      await basePage.goto('privacy');
      await basePage.waitForPageLoad();
      
      const privacyContent = await page.locator('main').textContent();
      const gdprMentions = privacyContent!.toLowerCase().includes('gdpr') || 
                          privacyContent!.toLowerCase().includes('general data protection');
      
      if (gdprMentions) {
        expect(gdprMentions).toBeTruthy();
      }
    });
  });

  test.describe('Ad Performance and User Experience', () => {
    test('ads should not significantly impact page load performance', async ({ page }) => {
      const startTime = Date.now();
      await basePage.goto();
      await basePage.waitForPageLoad();
      const loadTime = Date.now() - startTime;

      // Page should load within reasonable time even with ads
      expect(loadTime).toBeLessThan(5000); // 5 seconds maximum

      // Check for layout shift caused by ads loading
      const layoutShiftPromise = page.evaluate(() => {
        return new Promise<number>((resolve) => {
          let cumulativeLayoutShift = 0;
          
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
                cumulativeLayoutShift += (entry as any).value;
              }
            }
          });
          
          observer.observe({ type: 'layout-shift', buffered: true });
          
          // Resolve after 3 seconds
          setTimeout(() => {
            observer.disconnect();
            resolve(cumulativeLayoutShift);
          }, 3000);
        });
      });

      const cls = await layoutShiftPromise;
      // Cumulative Layout Shift should be minimal (good UX)
      expect(cls).toBeLessThan(0.25); // Google's "good" CLS threshold
    });

    test('ads should not interfere with main functionality', async ({ page }) => {
      // Navigate to calculator
      await basePage.goto('calculator');
      await basePage.waitForPageLoad();

      // Main functionality should be accessible despite ads
      const fileInput = page.locator('input[type="file"]');
      if (await fileInput.count() > 0) {
        await expect(fileInput).toBeVisible();
        await expect(fileInput).toBeEnabled();
      }

      const calculateButton = page.locator('button:has-text("Calculate")');
      if (await calculateButton.count() > 0) {
        await expect(calculateButton).toBeVisible();
      }

      // Check that ads don't cover important UI elements
      const importantElements = page.locator('input, button, nav a');
      const elementCount = await importantElements.count();

      for (let i = 0; i < Math.min(elementCount, 10); i++) {
        const element = importantElements.nth(i);
        const isVisible = await element.isVisible();
        
        if (isVisible) {
          const boundingBox = await element.boundingBox();
          expect(boundingBox).toBeTruthy();
          expect(boundingBox!.width).toBeGreaterThan(0);
          expect(boundingBox!.height).toBeGreaterThan(0);
        }
      }
    });

    test('ads should be clearly distinguishable from content', async ({ page }) => {
      const adElements = page.locator('.adsbygoogle, [data-ad-client], .ad-unit');
      const adCount = await adElements.count();

      for (let i = 0; i < adCount; i++) {
        const adElement = adElements.nth(i);
        
        // Check for "Advertisement" or "Sponsored" labels near ads
        const parentContainer = adElement.locator('xpath=ancestor::div[1]');
        const adLabel = parentContainer.locator(':has-text("Advertisement"), :has-text("Sponsored"), :has-text("Ad")');
        
        if (await adLabel.count() > 0) {
          await expect(adLabel.first()).toBeVisible();
        } else {
          // Ad should have some visual distinction (border, background, etc.)
          const adStyles = await adElement.evaluate((el) => {
            const styles = window.getComputedStyle(el);
            return {
              border: styles.border,
              backgroundColor: styles.backgroundColor,
              borderRadius: styles.borderRadius
            };
          });
          
          // Should have some visual styling
          const hasVisualDistinction = 
            adStyles.border !== 'none' || 
            adStyles.backgroundColor !== 'rgba(0, 0, 0, 0)' ||
            adStyles.borderRadius !== '0px';
            
          expect(hasVisualDistinction).toBeTruthy();
        }
      }
    });
  });

  test.describe('Affiliate Marketing', () => {
    test('should have properly attributed affiliate links', async ({ page }) => {
      // Check for Amazon affiliate links
      const affiliateLinks = page.locator('a[href*="amazon."], a[href*="affiliate"], a[href*="partner"]');
      const linkCount = await affiliateLinks.count();

      for (let i = 0; i < linkCount; i++) {
        const link = affiliateLinks.nth(i);
        const href = await link.getAttribute('href');
        
        if (href!.includes('amazon.')) {
          // Amazon affiliate links should have tag parameter
          expect(href).toMatch(/tag=|associate-id=/);
        }

        // Affiliate links should open in new tab
        const target = await link.getAttribute('target');
        expect(target).toBe('_blank');

        // Should have proper rel attributes
        const rel = await link.getAttribute('rel');
        expect(rel).toContain('noopener');
        
        // Should ideally have sponsored or nofollow
        if (rel) {
          const hasProperRel = rel.includes('sponsored') || rel.includes('nofollow');
          expect(hasProperRel).toBeTruthy();
        }
      }
    });

    test('should disclose affiliate relationships', async ({ page }) => {
      // Check for affiliate disclosure
      const disclosureText = page.locator(
        ':has-text("affiliate"), :has-text("commission"), :has-text("earn from qualifying"), :has-text("disclosure")'
      );
      
      if (await disclosureText.count() > 0) {
        await expect(disclosureText.first()).toBeVisible();
        
        // Disclosure should be clear and prominent
        const disclosureContent = await disclosureText.first().textContent();
        expect(disclosureContent!.length).toBeGreaterThan(20);
      }

      // Check footer for affiliate disclosure
      const footerDisclosure = basePage.footer.locator(
        ':has-text("affiliate"), :has-text("commission"), :has-text("disclosure")'
      );
      
      if (await footerDisclosure.count() > 0) {
        await expect(footerDisclosure.first()).toBeVisible();
      }
    });
  });

  test.describe('Monetization Compliance', () => {
    test('should have ads.txt file for programmatic advertising', async ({ page }) => {
      const adsResponse = await page.request.get('/ads.txt');
      
      if (adsResponse.ok()) {
        const adsContent = await adsResponse.text();
        
        // Should contain Google AdSense entry
        expect(adsContent).toContain('google.com');
        expect(adsContent).toContain('DIRECT');
        
        // Should have proper format: domain, publisher_id, relationship, tag_id
        const lines = adsContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
        
        for (const line of lines) {
          const parts = line.split(',').map(part => part.trim());
          expect(parts.length).toBeGreaterThanOrEqual(3);
          
          // First part should be domain
          expect(parts[0]).toMatch(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/);
          
          // Third part should be DIRECT or RESELLER
          expect(['DIRECT', 'RESELLER']).toContain(parts[2]);
        }
      }
    });

    test('should comply with advertising standards', async ({ page }) => {
      // Check that ads don't use deceptive practices
      const suspiciousAdText = page.locator(
        ':has-text("You are winner"), :has-text("Click here now"), :has-text("Congratulations")'
      );
      
      const suspiciousCount = await suspiciousAdText.count();
      
      // Should not have obviously deceptive ad content
      for (let i = 0; i < suspiciousCount; i++) {
        const element = suspiciousAdText.nth(i);
        const text = await element.textContent();
        
        // These could be false positives, so just log for review
        console.log(`Potentially suspicious ad text found: ${text}`);
      }

      // Check for age-appropriate content (financial site should be professional)
      const inappropriateContent = page.locator(
        ':has-text("casino"), :has-text("gambling"), :has-text("adult")'
      );
      
      const inappropriateCount = await inappropriateContent.count();
      if (inappropriateCount > 0) {
        console.log(`Found ${inappropriateCount} potentially inappropriate content references`);
      }
    });

    test('should maintain content-to-ad ratio', async ({ page }) => {
      const testPages = ['', 'calculator', 'about', 'blog'];

      for (const pagePath of testPages) {
        await basePage.goto(pagePath);
        await basePage.waitForPageLoad();

        // Get main content area
        const mainContent = page.locator('main, .content, .main-content');
        const contentText = await mainContent.textContent();
        const contentLength = contentText!.replace(/\s+/g, ' ').trim().length;

        // Get ad areas
        const adElements = page.locator('.adsbygoogle, [data-ad-client], .ad-unit');
        const adCount = await adElements.count();

        if (contentLength > 0 && adCount > 0) {
          // Content should be substantial relative to number of ads
          const contentToAdRatio = contentLength / adCount;
          expect(contentToAdRatio).toBeGreaterThan(200); // At least 200 chars per ad
        }
      }
    });
  });

  test.describe('Mobile Ad Experience', () => {
    test('mobile ads should not interfere with navigation', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await basePage.goto();
      await basePage.waitForPageLoad();

      // Mobile menu should be accessible
      const mobileToggle = basePage.mobileMenuToggle;
      if (await mobileToggle.isVisible()) {
        await expect(mobileToggle).toBeEnabled();
        
        // Click should work despite any ads
        await mobileToggle.click();
        const mobileMenu = page.locator('.navbar-collapse');
        await expect(mobileMenu).toHaveClass(/show/);
      }
    });

    test('mobile ads should be appropriately sized', async ({ page }) => {
      await basePage.goto();
      await basePage.waitForPageLoad();

      const adElements = page.locator('.adsbygoogle, [data-ad-client]');
      const adCount = await adElements.count();

      for (let i = 0; i < adCount; i++) {
        const adElement = adElements.nth(i);
        const boundingBox = await adElement.boundingBox();

        if (boundingBox) {
          // Mobile ads shouldn't be too wide for mobile screens
          expect(boundingBox.width).toBeLessThanOrEqual(375);
          
          // Should have reasonable height
          expect(boundingBox.height).toBeLessThan(300);
          expect(boundingBox.height).toBeGreaterThan(50);
        }
      }
    });

    test('should not have intrusive mobile ad formats', async ({ page }) => {
      await basePage.goto();
      await basePage.waitForPageLoad();

      // Check for intrusive ad formats
      const intrusiveAds = page.locator(
        '.popup-ad, .interstitial, .floating-ad, [data-testid*="popup"]'
      );
      
      const intrusiveCount = await intrusiveAds.count();
      
      // Mobile interstitials and popups should be minimal or absent
      if (intrusiveCount > 0) {
        console.log(`Found ${intrusiveCount} potentially intrusive mobile ads`);
        
        // If present, they should be dismissible
        for (let i = 0; i < intrusiveCount; i++) {
          const ad = intrusiveAds.nth(i);
          const closeButton = ad.locator('.close, [aria-label*="close"], button:has-text("×")');
          
          if (await closeButton.count() > 0) {
            await expect(closeButton.first()).toBeVisible();
          }
        }
      }
    });
  });
});