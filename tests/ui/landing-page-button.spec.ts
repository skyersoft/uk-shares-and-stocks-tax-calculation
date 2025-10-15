import { test, expect } from '@playwright/test';

test.describe('Landing Page Start Calculation Button', () => {
  test('should navigate to calculator when Start Calculation button is clicked', async ({ page }) => {
    // Enable console logging
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      consoleMessages.push(`${msg.type()}: ${msg.text()}`);
    });

    // Enable error tracking
    const errors: string[] = [];
    page.on('pageerror', error => {
      errors.push(error.message);
    });

    // Go to the landing page
    await page.goto('https://cgttaxtool.uk');
    
    // Wait for page to load completely
    await page.waitForLoadState('networkidle');
    
    // Check if page loaded successfully
    await expect(page).toHaveTitle(/IBKR|Tax|Calculator/i);
    
    // Log current page state
    console.log('Page loaded, looking for Start Calculation button...');
    
    // Look for the Start Calculation button with multiple selectors
    const buttonSelectors = [
      'button:has-text("Start Calculation")',
      '.btn:has-text("Start Calculation")',
      '[data-testid="start-calculation"]',
      'button:has-text("Start Free Calculation")',
      '.btn:has-text("Start Free Calculation")',
      'button[onclick*="calculator"]',
      'button[onclick*="getStarted"]'
    ];
    
    let startButton = null;
    for (const selector of buttonSelectors) {
      const button = page.locator(selector);
      if (await button.count() > 0 && await button.first().isVisible()) {
        startButton = button.first();
        console.log(`Found Start Calculation button with selector: ${selector}`);
        break;
      }
    }
    
    // If button not found, list all buttons for debugging
    if (!startButton) {
      console.log('Start Calculation button not found. Available buttons:');
      const allButtons = await page.locator('button').all();
      for (let i = 0; i < allButtons.length; i++) {
        const text = await allButtons[i].textContent();
        const visible = await allButtons[i].isVisible();
        console.log(`Button ${i}: "${text}" (visible: ${visible})`);
      }
      
      // Also check links that might be styled as buttons
      const allLinks = await page.locator('a').all();
      for (let i = 0; i < allLinks.length; i++) {
        const text = await allLinks[i].textContent();
        const visible = await allLinks[i].isVisible();
        const href = await allLinks[i].getAttribute('href');
        console.log(`Link ${i}: "${text}" href="${href}" (visible: ${visible})`);
      }
    }
    
    expect(startButton).toBeTruthy();
    
    // Get current URL before clicking
    const currentUrl = page.url();
    console.log(`Current URL before click: ${currentUrl}`);
    
    // Take a screenshot before clicking
    await page.screenshot({ path: 'tests/debug/before-click.png', fullPage: true });
    
    // Click the Start Calculation button
    await startButton!.click();
    
    // Wait a moment for any navigation or state changes
    await page.waitForTimeout(2000);
    
    // Take a screenshot after clicking
    await page.screenshot({ path: 'tests/debug/after-click.png', fullPage: true });
    
    // Check if URL changed or hash changed
    const newUrl = page.url();
    console.log(`URL after click: ${newUrl}`);
    
    // Check console messages for our debug logs
    console.log('Console messages:');
    consoleMessages.forEach(msg => console.log(msg));
    
    // Check for JavaScript errors
    if (errors.length > 0) {
      console.log('JavaScript errors:');
      errors.forEach(error => console.log(error));
    }
    
    // Check if we navigated to calculator page or hash changed
    const expectedHash = '#calculator';
    const hasCorrectHash = newUrl.includes(expectedHash);
    
    if (!hasCorrectHash) {
      // Check if there's a calculator element or different navigation pattern
      const calculatorContent = page.locator('[data-page="calculator"], .calculator-page, #calculator-section');
      const hasCalculatorContent = await calculatorContent.count() > 0;
      
      console.log(`Hash navigation: ${hasCorrectHash}, Calculator content visible: ${hasCalculatorContent}`);
      
      // If no hash navigation, check if it's a full page navigation
      if (newUrl !== currentUrl && (newUrl.includes('calculator') || newUrl.includes('calc'))) {
        console.log('Full page navigation to calculator detected');
      } else {
        console.log('No navigation detected - button click may not be working');
      }
    }
    
    // At minimum, expect either hash change or content change
    expect(hasCorrectHash || newUrl.includes('calculator') || newUrl !== currentUrl).toBeTruthy();
  });
  
  test('should have correct debug logging in console', async ({ page }) => {
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      if (msg.text().includes('[LandingPage]')) {
        consoleMessages.push(msg.text());
      }
    });
    
    await page.goto('https://cgttaxtool.uk');
    await page.waitForLoadState('networkidle');
    
    // Check if LandingPage component is rendering
    const hasRenderLog = consoleMessages.some(msg => msg.includes('Component rendering'));
    expect(hasRenderLog).toBeTruthy();
    
    // Click button and check for click log
    const startButton = page.locator('button:has-text("Start Calculation")').first();
    if (await startButton.count() > 0) {
      await startButton.click();
      await page.waitForTimeout(1000);
      
      const hasClickLog = consoleMessages.some(msg => msg.includes('Start Calculation button clicked'));
      expect(hasClickLog).toBeTruthy();
    }
  });
});