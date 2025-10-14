import { test, expect, devices } from '@playwright/test';
import { BasePage, PerformanceHelper } from './helpers/page-objects';

test.describe('Performance & Accessibility Tests', () => {
  test.describe('Core Web Vitals & Performance', () => {
    test('should have good page load performance', async ({ page }) => {
      const basePage = new BasePage(page);
      
      // Measure page load time
      const loadTime = await PerformanceHelper.measurePageLoad(page);
      expect(loadTime).toBeLessThan(3000); // 3 seconds for good UX
      
      await basePage.goto();
      await basePage.waitForPageLoad();

      // Check Largest Contentful Paint (LCP)
      const lcp = await page.evaluate(() => {
        return new Promise<number>((resolve) => {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            if (lastEntry) {
              resolve(lastEntry.startTime);
            }
          });
          
          observer.observe({ type: 'largest-contentful-paint', buffered: true });
          
          // Fallback timeout
          setTimeout(() => resolve(0), 5000);
        });
      });

      if (lcp > 0) {
        expect(lcp).toBeLessThan(2500); // Good LCP threshold
      }

      // Check First Contentful Paint (FCP)
      const paintTimings = await PerformanceHelper.checkLighthouseMetrics(page);
      if (paintTimings['first-contentful-paint']) {
        expect(paintTimings['first-contentful-paint']).toBeLessThan(1800); // Good FCP threshold
      }
    });

    test('should have minimal Cumulative Layout Shift', async ({ page }) => {
      const basePage = new BasePage(page);
      await basePage.goto();

      // Measure CLS over time
      const cls = await page.evaluate(() => {
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
          
          // Measure for 5 seconds
          setTimeout(() => {
            observer.disconnect();
            resolve(cumulativeLayoutShift);
          }, 5000);
        });
      });

      expect(cls).toBeLessThan(0.1); // Good CLS threshold
    });

    test('should optimize resource loading', async ({ page }) => {
      const basePage = new BasePage(page);
      await basePage.goto();
      await basePage.waitForPageLoad();

      // Check for resource optimization
      const resources = await page.evaluate(() => {
        const resourceEntries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
        return resourceEntries.map(entry => ({
          name: entry.name,
          size: entry.transferSize,
          duration: entry.duration,
          type: entry.initiatorType
        }));
      });

      // Check CSS resources are optimized
      const cssResources = resources.filter(r => r.type === 'link' || r.name.includes('.css'));
      const totalCSSSize = cssResources.reduce((sum, resource) => sum + (resource.size || 0), 0);
      
      if (totalCSSSize > 0) {
        expect(totalCSSSize).toBeLessThan(500000); // 500KB CSS limit
      }

      // Check JS resources are optimized
      const jsResources = resources.filter(r => r.type === 'script' || r.name.includes('.js'));
      const totalJSSize = jsResources.reduce((sum, resource) => sum + (resource.size || 0), 0);
      
      if (totalJSSize > 0) {
        expect(totalJSSize).toBeLessThan(1000000); // 1MB JS limit
      }

      // Check image optimization
      const imageResources = resources.filter(r => 
        r.type === 'img' || 
        r.name.includes('.jpg') || 
        r.name.includes('.png') || 
        r.name.includes('.webp')
      );
      
      for (const image of imageResources) {
        if (image.size && image.size > 0) {
          expect(image.size).toBeLessThan(1000000); // 1MB per image
        }
      }
    });

    test('should handle slow network conditions', async ({ page }) => {
      // Simulate slow 3G
      const client = await page.context().newCDPSession(page);
      await client.send('Network.emulateNetworkConditions', {
        offline: false,
        downloadThroughput: 1600 * 1024 / 8, // 1.6 Mbps
        uploadThroughput: 750 * 1024 / 8,    // 750 Kbps
        latency: 300 // 300ms
      });

      const basePage = new BasePage(page);
      const startTime = Date.now();
      await basePage.goto();
      await basePage.waitForPageLoad();
      const loadTime = Date.now() - startTime;

      // Should still load within reasonable time on slow network
      expect(loadTime).toBeLessThan(10000); // 10 seconds max

      // Critical content should be visible
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('nav')).toBeVisible();
    });

    test('should be responsive across different viewport sizes', async ({ page }) => {
      const basePage = new BasePage(page);
      
      const viewports = [
        { width: 320, height: 568, name: 'iPhone SE' },
        { width: 375, height: 667, name: 'iPhone 6/7/8' },
        { width: 768, height: 1024, name: 'iPad Portrait' },
        { width: 1024, height: 768, name: 'iPad Landscape' },
        { width: 1366, height: 768, name: 'Laptop' },
        { width: 1920, height: 1080, name: 'Desktop' }
      ];

      for (const viewport of viewports) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await basePage.goto();
        await basePage.waitForPageLoad();

        // Check that content is visible and properly laid out
        await expect(page.locator('main')).toBeVisible();
        await expect(page.locator('nav')).toBeVisible();

        // Check for horizontal scrollbar (should be minimal)
        const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
        expect(bodyWidth).toBeLessThanOrEqual(viewport.width + 20); // Allow small margin

        // Check navigation is appropriate for viewport
        if (viewport.width < 992) {
          // Mobile: should have hamburger menu
          const mobileToggle = page.locator('.navbar-toggler');
          if (await mobileToggle.count() > 0) {
            await expect(mobileToggle).toBeVisible();
          }
        } else {
          // Desktop: should have full navigation
          const navLinks = page.locator('nav .navbar-nav a');
          const linkCount = await navLinks.count();
          if (linkCount > 0) {
            await expect(navLinks.first()).toBeVisible();
          }
        }
      }
    });
  });

  test.describe('Accessibility (WCAG 2.1 AA)', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      const basePage = new BasePage(page);
      const testPages = ['', 'calculator', 'about', 'help'];

      for (const pagePath of testPages) {
        await basePage.goto(pagePath);
        await basePage.waitForPageLoad();

        const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
        expect(headings.length).toBeGreaterThan(0);

        const headingLevels = await Promise.all(
          headings.map(async (heading) => {
            const tagName = await heading.evaluate(el => el.tagName.toLowerCase());
            return parseInt(tagName.substring(1));
          })
        );

        // Should start with h1
        expect(headingLevels[0]).toBe(1);

        // Should not skip levels
        for (let i = 1; i < headingLevels.length; i++) {
          const levelDiff = headingLevels[i] - headingLevels[i - 1];
          expect(levelDiff).toBeLessThanOrEqual(1);
        }
      }
    });

    test('should have proper ARIA labels and roles', async ({ page }) => {
      const basePage = new BasePage(page);
      await basePage.goto();
      await basePage.waitForPageLoad();

      // Check navigation has proper role
      const nav = page.locator('nav[role="navigation"]');
      await expect(nav).toBeVisible();

      // Check form elements have labels
      const formInputs = page.locator('input, select, textarea');
      const inputCount = await formInputs.count();

      for (let i = 0; i < inputCount; i++) {
        const input = formInputs.nth(i);
        const inputId = await input.getAttribute('id');
        const ariaLabel = await input.getAttribute('aria-label');
        const ariaLabelledby = await input.getAttribute('aria-labelledby');

        if (inputId) {
          const label = page.locator(`label[for="${inputId}"]`);
          const hasLabel = await label.count() > 0;
          
          const hasAccessibleName = hasLabel || ariaLabel || ariaLabelledby;
          expect(hasAccessibleName).toBeTruthy();
        }
      }

      // Check buttons have accessible names
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();

      for (let i = 0; i < buttonCount; i++) {
        const button = buttons.nth(i);
        const buttonText = await button.textContent();
        const ariaLabel = await button.getAttribute('aria-label');
        const title = await button.getAttribute('title');

        const hasAccessibleName = 
          (buttonText && buttonText.trim().length > 0) || 
          ariaLabel || 
          title;
          
        expect(hasAccessibleName).toBeTruthy();
      }
    });

    test('should have sufficient color contrast', async ({ page }) => {
      const basePage = new BasePage(page);
      await basePage.goto();
      await basePage.waitForPageLoad();

      // Test key text elements for color contrast
      const textElements = page.locator('h1, h2, h3, p, a, button, label');
      const elementCount = await textElements.count();

      for (let i = 0; i < Math.min(elementCount, 20); i++) { // Test first 20 elements
        const element = textElements.nth(i);
        
        const contrast = await element.evaluate((el) => {
          const styles = window.getComputedStyle(el);
          const color = styles.color;
          const backgroundColor = styles.backgroundColor;
          
          // Simple RGB extraction (not comprehensive but basic check)
          const rgbToLuminance = (rgb: string) => {
            const match = rgb.match(/\d+/g);
            if (!match) return 0;
            
            const [r, g, b] = match.map(x => {
              const val = parseInt(x) / 255;
              return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
            });
            
            return 0.2126 * r + 0.7152 * g + 0.0722 * b;
          };
          
          const textLuminance = rgbToLuminance(color);
          const bgLuminance = rgbToLuminance(backgroundColor);
          
          const lighter = Math.max(textLuminance, bgLuminance);
          const darker = Math.min(textLuminance, bgLuminance);
          
          return (lighter + 0.05) / (darker + 0.05);
        });

        // WCAG AA requires 4.5:1 for normal text, 3:1 for large text
        if (contrast > 0) {
          expect(contrast).toBeGreaterThan(3); // Minimum for large text
        }
      }
    });

    test('should support keyboard navigation', async ({ page }) => {
      const basePage = new BasePage(page);
      await basePage.goto();
      await basePage.waitForPageLoad();

      // Test tab navigation
      const focusableElements = page.locator('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
      const focusableCount = await focusableElements.count();

      if (focusableCount > 0) {
        // Start tabbing
        await page.keyboard.press('Tab');
        
        let focusedElement = page.locator(':focus');
        await expect(focusedElement).toBeVisible();

        // Continue tabbing through elements
        for (let i = 0; i < Math.min(10, focusableCount - 1); i++) {
          await page.keyboard.press('Tab');
          focusedElement = page.locator(':focus');
          
          if (await focusedElement.count() > 0) {
            await expect(focusedElement).toBeVisible();
          }
        }

        // Test Shift+Tab (reverse navigation)
        await page.keyboard.press('Shift+Tab');
        focusedElement = page.locator(':focus');
        
        if (await focusedElement.count() > 0) {
          await expect(focusedElement).toBeVisible();
        }
      }
    });

    test('should support screen readers', async ({ page }) => {
      const basePage = new BasePage(page);
      await basePage.goto();
      await basePage.waitForPageLoad();

      // Check for landmark regions
      const landmarks = [
        'main',
        'nav',
        'header',
        'footer',
        '[role="main"]',
        '[role="navigation"]',
        '[role="banner"]',
        '[role="contentinfo"]'
      ];

      let landmarkCount = 0;
      for (const landmark of landmarks) {
        const elements = page.locator(landmark);
        const count = await elements.count();
        landmarkCount += count;
      }

      expect(landmarkCount).toBeGreaterThan(2); // At least main and nav

      // Check for skip links
      const skipLinks = page.locator('a[href="#main"], a:has-text("Skip to")');
      if (await skipLinks.count() > 0) {
        await expect(skipLinks.first()).toBeAttached();
      }

      // Check alt text for images
      const images = page.locator('img');
      const imageCount = await images.count();

      for (let i = 0; i < imageCount; i++) {
        const img = images.nth(i);
        const alt = await img.getAttribute('alt');
        
        // Alt attribute should exist (can be empty for decorative images)
        expect(alt).not.toBeNull();
      }
    });

    test('should handle focus management properly', async ({ page }) => {
      const basePage = new BasePage(page);
      await basePage.goto('calculator');
      await basePage.waitForPageLoad();

      // Test focus management in modals or dynamic content
      const modalTriggers = page.locator('button[data-bs-toggle="modal"], button:has-text("Help"), button:has-text("Info")');
      const triggerCount = await modalTriggers.count();

      if (triggerCount > 0) {
        const trigger = modalTriggers.first();
        await trigger.click();

        // Modal should be visible
        const modal = page.locator('.modal, [role="dialog"]');
        if (await modal.count() > 0) {
          await expect(modal.first()).toBeVisible();

          // Focus should be trapped in modal
          const modalFocusable = modal.locator('button, input, select, textarea, a[href]');
          const focusableCount = await modalFocusable.count();

          if (focusableCount > 0) {
            // First focusable element should receive focus
            const firstFocusable = modalFocusable.first();
            await expect(firstFocusable).toBeFocused();

            // Escape should close modal
            await page.keyboard.press('Escape');
            
            // Modal should be hidden and focus returned
            if (await modal.first().isVisible()) {
              await expect(modal.first()).not.toBeVisible();
            }
          }
        }
      }
    });

    test('should provide error feedback accessibly', async ({ page }) => {
      const basePage = new BasePage(page);
      await basePage.goto('calculator');
      await basePage.waitForPageLoad();

      // Try to trigger a form error
      const calculateButton = page.locator('button:has-text("Calculate")');
      if (await calculateButton.count() > 0) {
        await calculateButton.click();

        // Check for error messages
        const errorMessages = page.locator('.alert-danger, .error-message, [role="alert"]');
        const errorCount = await errorMessages.count();

        if (errorCount > 0) {
          const errorMessage = errorMessages.first();
          await expect(errorMessage).toBeVisible();

          // Error should be announced to screen readers
          const role = await errorMessage.getAttribute('role');
          const ariaLive = await errorMessage.getAttribute('aria-live');
          
          const isAccessible = role === 'alert' || ariaLive === 'assertive' || ariaLive === 'polite';
          expect(isAccessible).toBeTruthy();
        }
      }
    });
  });

  test.describe('Cross-Browser Compatibility', () => {
    const browsers = [
      { name: 'chromium', device: devices['Desktop Chrome'] },
      { name: 'firefox', device: devices['Desktop Firefox'] },
      { name: 'webkit', device: devices['Desktop Safari'] }
    ];

    for (const browser of browsers) {
      test(`should work correctly in ${browser.name}`, async ({ page, browserName }) => {
        // Skip if not the current browser
        test.skip(browserName !== browser.name, `Running only on ${browser.name}`);
        
        const basePage = new BasePage(page);
        await basePage.goto();
        await basePage.waitForPageLoad();

        // Basic functionality should work
        await expect(page.locator('nav')).toBeVisible();
        await expect(page.locator('main')).toBeVisible();
        await expect(page.locator('footer')).toBeVisible();

        // Navigation should work
        const navLinks = page.locator('nav a');
        const linkCount = await navLinks.count();
        
        if (linkCount > 0) {
          await navLinks.first().click();
          await basePage.waitForPageLoad();
          await expect(page.locator('main')).toBeVisible();
        }

        // CSS should load properly
        const computedStyle = await page.locator('body').evaluate(el => {
          const styles = window.getComputedStyle(el);
          return {
            fontFamily: styles.fontFamily,
            backgroundColor: styles.backgroundColor
          };
        });

        expect(computedStyle.fontFamily).toBeTruthy();
      });
    }

    test('should handle JavaScript disabled gracefully', async ({ page }) => {
      // Disable JavaScript
      await page.route('**/*.js', route => route.abort());

      const basePage = new BasePage(page);
      await basePage.goto();

      // Basic structure should still be visible
      await expect(page.locator('nav')).toBeVisible();
      await expect(page.locator('main')).toBeVisible();
      await expect(page.locator('footer')).toBeVisible();

      // Links should still work
      const staticLinks = page.locator('a[href^="/"], a[href^="http"]');
      const linkCount = await staticLinks.count();

      if (linkCount > 0) {
        const firstLink = staticLinks.first();
        await firstLink.click();
        
        // Should navigate (even if functionality is limited)
        await page.waitForLoadState('networkidle');
        await expect(page.locator('main')).toBeVisible();
      }
    });
  });

  test.describe('Mobile Performance', () => {
    test('should load quickly on mobile devices', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      const basePage = new BasePage(page);
      
      const startTime = Date.now();
      await basePage.goto();
      await basePage.waitForPageLoad();
      const loadTime = Date.now() - startTime;

      // Mobile should load within 4 seconds
      expect(loadTime).toBeLessThan(4000);

      // Check mobile-specific optimizations
      const viewport = page.locator('meta[name="viewport"]');
      await expect(viewport).toBeAttached();
      
      const viewportContent = await viewport.getAttribute('content');
      expect(viewportContent).toContain('width=device-width');
    });

    test('should be touch-friendly', async ({ page }) => {
      const basePage = new BasePage(page);
      await basePage.goto();
      await basePage.waitForPageLoad();

      // Check touch target sizes
      const touchTargets = page.locator('button, a, input[type="checkbox"], input[type="radio"]');
      const targetCount = await touchTargets.count();

      for (let i = 0; i < Math.min(targetCount, 10); i++) {
        const target = touchTargets.nth(i);
        const boundingBox = await target.boundingBox();

        if (boundingBox) {
          // Touch targets should be at least 44px (Apple HIG) or 48dp (Material Design)
          expect(Math.min(boundingBox.width, boundingBox.height)).toBeGreaterThanOrEqual(40);
        }
      }
    });

    test('should handle mobile interactions', async ({ page }) => {
      const basePage = new BasePage(page);
      await basePage.goto();
      await basePage.waitForPageLoad();

      // Test mobile menu
      const mobileToggle = basePage.mobileMenuToggle;
      if (await mobileToggle.isVisible()) {
        // Tap to open
        await mobileToggle.tap();
        
        const mobileMenu = page.locator('.navbar-collapse');
        await expect(mobileMenu).toHaveClass(/show/);

        // Tap to close
        await mobileToggle.tap();
        await expect(mobileMenu).not.toHaveClass(/show/);
      }

      // Test scroll behavior
      await page.evaluate(() => window.scrollTo(0, 500));
      
      const scrollPosition = await page.evaluate(() => window.pageYOffset);
      expect(scrollPosition).toBeGreaterThan(400);
    });
  });

  test.describe('Performance Monitoring', () => {
    test('should track Core Web Vitals', async ({ page }) => {
      const basePage = new BasePage(page);
      await basePage.goto();

      // Get Core Web Vitals
      const vitals = await page.evaluate(() => {
        return new Promise((resolve) => {
          const vitals: any = {};
          
          // LCP
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            vitals.lcp = lastEntry.startTime;
          }).observe({ type: 'largest-contentful-paint', buffered: true });

          // FID
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              vitals.fid = (entry as any).processingStart - entry.startTime;
            }
          }).observe({ type: 'first-input', buffered: true });

          // CLS
          let clsValue = 0;
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (!(entry as any).hadRecentInput) {
                clsValue += (entry as any).value;
              }
            }
            vitals.cls = clsValue;
          }).observe({ type: 'layout-shift', buffered: true });

          // Resolve after collecting metrics
          setTimeout(() => resolve(vitals), 3000);
        });
      });

      // Log vitals for monitoring
      console.log('Core Web Vitals:', vitals);

      // Validate thresholds
      if ((vitals as any).lcp) {
        expect((vitals as any).lcp).toBeLessThan(2500); // Good LCP
      }
      
      if ((vitals as any).fid) {
        expect((vitals as any).fid).toBeLessThan(100); // Good FID
      }
      
      if ((vitals as any).cls !== undefined) {
        expect((vitals as any).cls).toBeLessThan(0.1); // Good CLS
      }
    });
  });
});