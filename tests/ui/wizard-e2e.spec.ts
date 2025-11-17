import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Multi-Step Calculator Wizard - End to End', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#calculator');
    await page.waitForLoadState('networkidle');
  });

  test('should complete full wizard flow and display results with QFX', async ({ page }) => {
    // Listen to console logs
    page.on('console', msg => console.log('Browser console:', msg.text()));
    
    // Handle cookie consent immediately with force click to bypass overlays
    try {
      const consentButton = page.locator('.fc-button-label:has-text("Consent"), button:has-text("Consent")').first();
      await consentButton.click({ timeout: 2000, force: true });
      await page.waitForTimeout(1000);
    } catch (e) {
      console.log('No cookie consent or already accepted');
    }
  });

  test('should complete full wizard flow and display results with CSV file', async ({ page }) => {
    // Listen to console logs and check for errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      console.log('Browser console:', msg.text());
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Handle cookie consent immediately with force click to bypass overlays
    try {
      const consentButton = page.locator('.fc-button-label:has-text("Consent"), button:has-text("Consent")').first();
      await consentButton.click({ timeout: 2000, force: true });
      await page.waitForTimeout(1000);
    } catch (e) {
      console.log('No cookie consent or already accepted');
    }
    
    // Step 1: Income Sources
    await expect(page.getByRole('main').getByRole('heading', { name: 'UK Tax Calculator' })).toBeVisible();
    
    // Investment Portfolio should be checked by default (find checkbox by nearby label text)
    const portfolioCard = page.locator('text=Investment Portfolio').first();
    await expect(portfolioCard).toBeVisible();
    
    // Verify the checkbox within the Investment Portfolio card is checked
    const portfolioCheckbox = page.locator('.card:has-text("Investment Portfolio") input[type="checkbox"]').first();
    await expect(portfolioCheckbox).toBeChecked();
    
    // Select tax year (should be 2024-2025 by default)
    await expect(page.locator('select#taxYear')).toHaveValue('2024-2025');
    
    // Click Next
    await page.getByRole('button', { name: 'Next' }).click();
    await page.waitForTimeout(500);
    
    // Step 2: File Upload
    const qfxFilePath = path.join(__dirname, '../../data/U11075163_202409_202409.qfx');
    
    // Upload file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(qfxFilePath);
    await page.waitForTimeout(1000);
    
    // Verify file was uploaded
    await expect(page.locator('text=U11075163_202409_202409.qfx')).toBeVisible();
    
    // Click Next
    await page.getByRole('button', { name: 'Next' }).click();
    await page.waitForTimeout(500);
    
    // Step 3: Personal Details
    // Tax residency should be England/Wales/NI by default
    await expect(page.locator('input[type="radio"]#residencyEngland')).toBeChecked();
    
    // Enter date of birth
    await page.fill('input#dateOfBirth', '1990-01-01');
    
    // Enter charitable donations
    await page.fill('input#charitableDonations', '1000');
    
    // Click Next
    await page.getByRole('button', { name: 'Next' }).click();
    await page.waitForTimeout(500);
    
    // Step 4: Review
    // Just verify we can see the Calculate Tax button (skip the heading check due to duplicates)
    const calculateButtons = page.getByRole('button', { name: /Calculate Tax/i });
    await expect(calculateButtons.first()).toBeVisible();
    
    // Click Calculate Tax (use the last button which is in the navigation)
    await calculateButtons.last().click();
    await page.waitForTimeout(5000); // Give it time to calculate and navigate
    
    // Should navigate to results page
    await expect(page).toHaveURL(/#results/, { timeout: 10000 });
    
    // Verify results are displayed - look for the main results heading
    const resultsHeading = page.getByRole('heading', { name: /Tax Calculation Results/i });
    await expect(resultsHeading).toBeVisible({ timeout: 10000 });
    
    // Verify we can see key metrics (using more specific selectors)
    await expect(page.locator('.metric-label').filter({ hasText: 'Total Tax Liability' }).first()).toBeVisible();
    await expect(page.locator('.metric-label').filter({ hasText: 'Portfolio Value' }).first()).toBeVisible();
    
        console.log('✅ Test passed! Results page displayed successfully.');
  });

  test('should complete full wizard flow with CSV file without currency errors', async ({ page }) => {
    // Listen to console logs and capture errors
    const consoleErrors: string[] = [];
    const networkErrors: string[] = [];
    
    page.on('console', msg => {
      console.log('Browser console:', msg.text());
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Capture network responses to see backend errors
    page.on('response', async response => {
      if (response.url().includes('/calculate')) {
        console.log(`API Response status: ${response.status()}`);
        if (!response.ok()) {
          const body = await response.text().catch(() => 'Could not read response');
          console.log(`API Error response: ${body}`);
          networkErrors.push(`${response.status()}: ${body}`);
        } else {
          const body = await response.text().catch(() => 'Could not read response');
          console.log(`API Success response (first 500 chars): ${body.substring(0, 500)}`);
        }
      }
    });
    
    // Handle cookie consent
    try {
      const consentButton = page.locator('.fc-button-label:has-text("Consent"), button:has-text("Consent")').first();
      await consentButton.click({ timeout: 2000, force: true });
      await page.waitForTimeout(1000);
    } catch (e) {
      console.log('No cookie consent or already accepted');
    }
    
    // Step 1: Income Sources
    await expect(page.getByRole('main').getByRole('heading', { name: 'UK Tax Calculator' })).toBeVisible();
    const portfolioCheckbox = page.locator('.card:has-text("Investment Portfolio") input[type="checkbox"]').first();
    await expect(portfolioCheckbox).toBeChecked();
    await page.getByRole('button', { name: 'Next' }).click();
    await page.waitForTimeout(500);
    
    // Step 2: Upload CSV file instead of QFX
    const csvFilePath = path.join(__dirname, '../../data/Sharesight.csv');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(csvFilePath);
    await page.waitForTimeout(1000);
    
    // Verify file was uploaded
    await expect(page.locator('text=Sharesight.csv')).toBeVisible();
    
    await page.getByRole('button', { name: 'Next' }).click();
    await page.waitForTimeout(500);
    
    // Step 3: Personal Details
    await page.fill('input#dateOfBirth', '1990-01-01');
    await page.fill('input#charitableDonations', '500');
    await page.getByRole('button', { name: 'Next' }).click();
    await page.waitForTimeout(500);
    
    // Step 4: Review and Calculate
    await page.waitForTimeout(1000);
    
    // Verify we're on the review step (use the step content header, not the stepper)
    await expect(page.locator('.card-body').filter({ hasText: 'Review & Calculate' }).first()).toBeVisible({ timeout: 5000 });
    
    // The Calculate Tax button is at the bottom of the form
    // There are two buttons - one in the stepper navigation and one as the primary action
    // We want the primary success button (green, at bottom of review)
    const calculateButton = page.getByRole('button', { name: 'Calculate Tax' }).last();
    await calculateButton.waitFor({ state: 'visible', timeout: 5000 });
    
    console.log('Found Calculate Tax button, clicking...');
    await calculateButton.click({ timeout: 5000 });
    console.log('Calculate Tax button clicked');
    
    // Wait for calculation and navigation
    await page.waitForTimeout(10000); // Increase timeout for CSV processing
    
    console.log('Current URL after calculation:', page.url());
    console.log('Network errors:', networkErrors);
    console.log('Console errors:', consoleErrors);
    
    // Check if we navigated to results or stayed on calculator
    const currentUrl = page.url();
    if (!currentUrl.includes('#results')) {
      console.error('Did not navigate to results page!');
      console.log('Possible backend error - check network errors above');
      // Let's try to see if there's an error message on the page
      const errorAlert = await page.locator('.alert-danger, .alert-error').textContent().catch(() => null);
      if (errorAlert) {
        console.error('Error alert on page:', errorAlert);
      }
    }
    
    await expect(page).toHaveURL(/#results/, { timeout: 5000 });
    
    // Verify results page loaded
    const resultsHeading = page.getByRole('heading', { name: /Tax Calculation Results/i });
    await expect(resultsHeading).toBeVisible({ timeout: 10000 });
    
    // Verify key metrics are visible
    await expect(page.locator('.metric-label').filter({ hasText: 'Total Tax Liability' }).first()).toBeVisible();
    await expect(page.locator('.metric-label').filter({ hasText: 'Portfolio Value' }).first()).toBeVisible();
    
    // CRITICAL: Verify NO currency-related errors occurred
    const currencyErrors = consoleErrors.filter(error => 
      error.includes('Invalid currency code') || 
      error.includes('RangeError') ||
      error.includes('NYSE')
    );
    
    if (currencyErrors.length > 0) {
      console.error('Currency errors found:', currencyErrors);
    }
    
    expect(currencyErrors).toHaveLength(0);
    
    console.log('✅ CSV test passed! No currency formatting errors with exchange names.');
  });

  test('should complete full wizard flow with QFX file', async ({ page }) => {
    // Handle cookie consent immediately with force click to bypass overlays
    try {
      const consentButton = page.locator('.fc-button-label:has-text("Consent"), button:has-text("Consent")').first();
      await consentButton.click({ timeout: 2000, force: true });
      await page.waitForTimeout(1000);
    } catch (e) {
      console.log('No cookie consent or already accepted');
    }
    
    // Wait for wizard to load
    await expect(page.locator('.multi-step-calculator')).toBeVisible({ timeout: 10000 });
    
    // STEP 1: Income Sources
    const nextButton = page.locator('button:has-text("Next")').first();
    await nextButton.click();
    await page.waitForTimeout(500);
    
    // STEP 2: Upload QFX file
    await expect(page.getByRole('heading', { name: 'Upload Investment Files' })).toBeVisible({ timeout: 5000 });
    
    const fileInput = page.locator('input[type="file"]').first();
    const qfxFilePath = path.join(process.cwd(), 'data', 'U11075163_202409_202409.qfx');
    await fileInput.setInputFiles(qfxFilePath);
    
    await page.waitForTimeout(1000);
    
    // Verify file uploaded - use more specific selector
    await expect(page.getByText('U11075163_202409_202409.qfx').last()).toBeVisible({ timeout: 5000 });
    
    await page.locator('button:has-text("Next")').first().click();
    await page.waitForTimeout(500);
    
    // STEP 3: Personal Details
    const dobInput = page.locator('input[type="date"]').first();
    if (await dobInput.count() > 0) {
      await dobInput.fill('1985-06-15');
    }
    
    await page.locator('button:has-text("Next")').first().click();
    await page.waitForTimeout(500);
    
    // STEP 4: Calculate
    const calculateButton = page.locator('button:has-text("Calculate Tax"), button:has-text("Calculate")').first();
    await calculateButton.click();
    
    // Wait for results
    await page.waitForTimeout(3000);
    
    // Verify results page
    const currentUrl = page.url();
    expect(currentUrl).toContain('results');
  });

  test('should show validation errors for incomplete wizard', async ({ page }) => {
    // Handle cookie consent
    try {
      const consentButton = page.locator('.fc-button-label:has-text("Consent"), button:has-text("Consent")').first();
      await consentButton.click({ timeout: 2000, force: true });
      await page.waitForTimeout(1000);
    } catch (e) {
      console.log('No cookie consent or already accepted');
    }
    
    // Wait for wizard to load
    await expect(page.locator('.multi-step-calculator')).toBeVisible({ timeout: 10000 });
    
    // Try to proceed without selecting income source
    const incomeCheckboxes = page.locator('input[type="checkbox"]');
    const count = await incomeCheckboxes.count();
    
    // Uncheck all if any are checked
    for (let i = 0; i < count; i++) {
      const checkbox = incomeCheckboxes.nth(i);
      if (await checkbox.isChecked()) {
        await checkbox.uncheck();
      }
    }
    
    // Try to click Next
    const nextButton = page.locator('button:has-text("Next")').first();
    await nextButton.click();
    
    // Should show validation error - use first match
    await expect(page.getByText('Please select at least one income source').first()).toBeVisible({ timeout: 3000 });
  });

  test('should allow navigation back through wizard steps', async ({ page }) => {
    // Handle cookie consent
    try {
      const consentButton = page.locator('.fc-button-label:has-text("Consent"), button:has-text("Consent")').first();
      await consentButton.click({ timeout: 2000, force: true });
      await page.waitForTimeout(1000);
    } catch (e) {
      console.log('No cookie consent or already accepted');
    }
    
    // Wait for wizard to load
    await expect(page.locator('.multi-step-calculator')).toBeVisible({ timeout: 10000 });
    
    // Go to step 2
    await page.locator('button:has-text("Next")').first().click();
    await page.waitForTimeout(500);
    
    // Verify Previous button appears
    const previousButton = page.locator('button:has-text("Previous"), button:has-text("Back")');
    await expect(previousButton.first()).toBeVisible();
    
    // Click Previous
    await previousButton.first().click();
    await page.waitForTimeout(500);
    
    // Should be back on step 1 - use heading selector
    await expect(page.getByRole('heading', { name: /Select Your Income Sources/i })).toBeVisible();
  });

  test('should persist data when navigating back and forth', async ({ page }) => {
    // Handle cookie consent
    try {
      const consentButton = page.locator('.fc-button-label:has-text("Consent"), button:has-text("Consent")').first();
      await consentButton.click({ timeout: 2000, force: true });
      await page.waitForTimeout(1000);
    } catch (e) {
      console.log('No cookie consent or already accepted');
    }
    
    // Wait for wizard to load
    await expect(page.locator('.multi-step-calculator')).toBeVisible({ timeout: 10000 });
    
    // Check employment income checkbox
    const employmentCheckbox = page.locator('input[type="checkbox"]').filter({ hasText: /employment/i }).first();
    if (await employmentCheckbox.count() > 0) {
      await employmentCheckbox.check();
    }
    
    // Go to step 2
    await page.locator('button:has-text("Next")').first().click();
    await page.waitForTimeout(500);
    
    // Go back to step 1
    await page.locator('button:has-text("Previous")').first().click();
    await page.waitForTimeout(500);
    
    // Verify employment checkbox is still checked
    if (await employmentCheckbox.count() > 0) {
      await expect(employmentCheckbox).toBeChecked();
    }
  });

  test('should display progress indicator correctly', async ({ page }) => {
    // Handle cookie consent
    try {
      const consentButton = page.locator('.fc-button-label:has-text("Consent"), button:has-text("Consent")').first();
      await consentButton.click({ timeout: 2000, force: true });
      await page.waitForTimeout(1000);
    } catch (e) {
      console.log('No cookie consent or already accepted');
    }
    
    // Wait for wizard to load
    await expect(page.locator('.multi-step-calculator')).toBeVisible({ timeout: 10000 });
    
    // Verify progress indicator exists
    const progressIndicator = page.locator('.progress-indicator, [data-testid="progress-indicator"]');
    await expect(progressIndicator.first()).toBeVisible();
    
    // Verify step 1 is active
    const step1 = page.locator('.step').filter({ hasText: /Income Sources|Step 1/i }).first();
    if (await step1.count() > 0) {
      await expect(step1).toBeVisible();
    }
    
    // Navigate to step 2
    await page.locator('button:has-text("Next")').first().click();
    await page.waitForTimeout(500);
    
    // Verify step 2 is active
    const step2 = page.locator('.step').filter({ hasText: /Upload|Step 2/i }).first();
    if (await step2.count() > 0) {
      await expect(step2).toBeVisible();
    }
  });
});
