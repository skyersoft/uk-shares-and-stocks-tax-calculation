import { test, expect } from '@playwright/test';

const blogIndexHash = '#blog';

test.describe('Blog Page', () => {

  test('loads blog index with posts', async ({ page }) => {
    // Capture console messages for debugging
    const consoleMessages: string[] = [];
    page.on('console', (msg) => {
      consoleMessages.push(`${msg.type()}: ${msg.text()}`);
    });

    await page.goto(`/index.html${blogIndexHash}`);

    // Wait for page to load - either blog posts or error message should appear
    await page.waitForTimeout(5000); // Wait for React to initialize

    // Always output console messages for debugging
    console.log('Console messages:', consoleMessages.join('\n'));
    
    const noPosts = await page.locator('text=No blog posts found').first().isVisible().catch(() => false);
    if (noPosts) {
      throw new Error('Expected blog posts to load, but got "No blog posts found" message');
    }

    const cards = page.locator('.blog-posts .blog-post-card');
    // Poll until at least one card appears or fail
    await expect.poll(async () => await cards.count(), { timeout: 10000 }).toBeGreaterThan(0);
  });

});