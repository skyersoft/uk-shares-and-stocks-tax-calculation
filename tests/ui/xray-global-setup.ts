import { chromium, FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * Warm the Vite dev server so on-demand dependency optimisation (which can reload
 * the page mid-test) finishes before the first test runs.
 */
export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0].use.baseURL as string;
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const basic = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'fixtures', 'xray', 'basic.json'), 'utf-8'),
  );
  await page.route('**/inspect-file', route => route.fulfill({ json: basic }));
  try {
    await page.goto(`${baseURL}/calculator`, { waitUntil: 'networkidle', timeout: 90_000 });
    await page.getByRole('button', { name: 'Next' }).click();
    await page.locator('input[type="file"]').setInputFiles({
      name: 'activity_basic.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from('Statement,Header,Field Name,Field Value\n'),
    });
    await page.getByRole('heading', { name: 'Your columns, one by one' }).waitFor({ timeout: 60_000 });
    await page.waitForLoadState('networkidle');
  } finally {
    await browser.close();
  }
}
