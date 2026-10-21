import { test, expect, Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * File X-ray on the calculator upload step.
 * /inspect-file is stubbed with JSON produced by the real backend inspector
 * (regenerate with: python tests/ui/fixtures/xray/generate_fixtures.py).
 * Run against a local dev build: npx playwright test -c playwright.xray.config.ts
 */
const FIXTURES = path.join(__dirname, 'fixtures', 'xray');
const upload = (name: string) => path.join(FIXTURES, 'uploads', name);
const fixture = (name: string) =>
  JSON.parse(fs.readFileSync(path.join(FIXTURES, name), 'utf-8'));

async function stubInspect(page: Page, fixtureName: string) {
  const calls: string[] = [];
  await page.route('**/inspect-file', async route => {
    calls.push(route.request().url());
    await route.fulfill({ json: fixture(fixtureName) });
  });
  return calls;
}

/** No local backend: answer the other calls the upload step makes so they cannot stall the page. */
test.beforeEach(async ({ page }) => {
  await page.route('**/detect-broker', route => route.fulfill({ status: 404, json: { error: 'stubbed' } }));
});

/** Dismiss the consent overlay (if any) and move from Income Sources to the upload step. */
async function reachUploadStep(page: Page) {
  await page.goto('/calculator');
  const consent = page.getByRole('button', { name: /^consent$/i }).first();
  try {
    await consent.waitFor({ state: 'visible', timeout: 2000 });
    await consent.click();
  } catch {
    // no consent overlay
  }
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.locator('input[type="file"]')).toBeAttached();
}

const nextButton = (page: Page) => page.getByRole('button', { name: 'Next' });

test.describe('File X-ray on the upload step', () => {
  test('X-ray - basic Activity Statement is recognised and Next is enabled', async ({ page }) => {
    const calls = await stubInspect(page, 'basic.json');
    await reachUploadStep(page);

    await test.step('upload the file', async () => {
      await page.locator('input[type="file"]').setInputFiles(upload('activity_basic.csv'));
    });

    await test.step('format and column table are shown', async () => {
      await expect(page.getByRole('list', { name: 'Checks on this file' })).toContainText('IBKR Activity Statement');
      await expect(page.getByRole('heading', { name: 'Your columns, one by one' })).toBeVisible();
      await expect(page.getByRole('table')).toContainText('understood');
      await expect(page.getByRole('table')).toContainText('ignored: Not needed for the calculation');
    });

    await test.step('Next is enabled', async () => {
      await expect(nextButton(page)).toBeEnabled();
      expect(calls).toHaveLength(1);
    });
  });

  test('X-ray - options-only statement shows unsupported assets and blocks Next', async ({ page }) => {
    const calls = await stubInspect(page, 'options_only.json');
    await reachUploadStep(page);
    await page.locator('input[type="file"]').setInputFiles(upload('options_only.csv'));

    await expect(page.getByText(/only contains unsupported asset types/i)).toBeVisible();
    await expect(nextButton(page)).toBeDisabled();
    await expect(page.getByText(/Fix or remove file options_only\.csv/i)).toBeVisible();
    expect(calls).toHaveLength(1);
  });

  test('X-ray - a PDF fails instantly without calling the server', async ({ page }) => {
    const calls = await stubInspect(page, 'basic.json');
    await reachUploadStep(page);
    await page.locator('input[type="file"]').setInputFiles(upload('statement.pdf'));

    await expect(page.getByText(/looks like a PDF|We need the CSV or QFX/i).first()).toBeVisible();
    await expect(nextButton(page)).toBeDisabled();
    expect(calls).toHaveLength(0);
  });

  test('X-ray - sell with no earlier buy warns and needs acknowledgement', async ({ page }) => {
    const calls = await stubInspect(page, 'sell_no_buy.json');
    await reachUploadStep(page);
    await page.locator('input[type="file"]').setInputFiles(upload('sell_no_buy.csv'));

    const box = page.getByTestId('sell-without-buy');
    await test.step('warning lists the sell and its effect', async () => {
      await expect(box).toBeVisible();
      await expect(box).toContainText('AAAA');
      await expect(box).toContainText('2025-07-01');
      await expect(box).toContainText(/overstated/i);
    });

    await test.step('both fix buttons are offered', async () => {
      await expect(box.getByRole('button', { name: 'Add another file' })).toBeVisible();
      await box.getByRole('button', { name: 'Add opening holdings' }).click();
      await expect(page.getByText(/coming soon/i)).toBeVisible();
    });

    await test.step('Next stays disabled until acknowledged', async () => {
      await expect(nextButton(page)).toBeDisabled();
      await page.getByRole('checkbox', { name: /I understand my history is incomplete/i }).check();
      await expect(nextButton(page)).toBeEnabled();
      expect(calls).toHaveLength(1);
    });
  });

  test('X-ray - the same file twice shows a duplicate warning', async ({ page }) => {
    const calls = await stubInspect(page, 'duplicate.json');
    await reachUploadStep(page);
    await page
      .locator('input[type="file"]')
      .setInputFiles([upload('duplicate_a.csv'), upload('duplicate_b.csv')]);

    await expect(page.getByText(/looks like a duplicate/i).first()).toBeVisible();
    await expect(page.getByText(/identical copy of duplicate_a\.csv/i).first()).toBeVisible();
    expect(calls).toHaveLength(1);
  });

  test('X-ray - inspection failure shows a notice and does not block Next', async ({ page }) => {
    await page.route('**/inspect-file', route => route.fulfill({ status: 500, body: 'boom' }));
    await reachUploadStep(page);
    await page.locator('input[type="file"]').setInputFiles(upload('activity_basic.csv'));

    await expect(page.getByText(/We couldn't check your file just now/i)).toBeVisible();
    await expect(nextButton(page)).toBeEnabled();
  });

  test('X-ray - quoted Flex Query file shows the unsupported-format screen', async ({ page }) => {
    const calls = await stubInspect(page, 'flex_quoted.json');
    await reachUploadStep(page);
    await page.locator('input[type="file"]').setInputFiles(upload('flex_quoted.csv'));

    await expect(page.getByRole('heading', { name: /wrong report/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'How to export it' })).toBeVisible();
    await expect(page.getByTestId('export-steps')).toContainText('Flex Queries');
    await expect(page.getByRole('button', { name: 'Ask us to add support' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Remove file' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Pick my broker/i })).toHaveCount(0);
    expect(calls).toHaveLength(1);
    await expect(nextButton(page)).toBeDisabled();
  });
});
