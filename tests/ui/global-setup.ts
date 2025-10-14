import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  // Start browser for any global setup operations
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // Verify site is accessible
  try {
    await page.goto('https://cgttaxtool.uk');
    console.log('✅ Site is accessible at https://cgttaxtool.uk');
  } catch (error) {
    console.log('⚠️ Main site not accessible, tests will run against local/fallback');
  }

  await browser.close();
}

export default globalSetup;