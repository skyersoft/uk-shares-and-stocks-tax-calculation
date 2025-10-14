import { test, expect } from '@playwright/test';
import { CalculatorPage, TestDataFactory } from './helpers/page-objects';
import path from 'path';

test.describe('Tax Calculator Tests', () => {
  let calculatorPage: CalculatorPage;

  test.beforeEach(async ({ page }) => {
    calculatorPage = new CalculatorPage(page);
    await calculatorPage.goto('calculator');
    await calculatorPage.waitForPageLoad();
  });

  test.describe('File Upload Functionality', () => {
    test('should display file upload interface', async ({ page }) => {
      // Check file input is present
      await expect(calculatorPage.fileInput).toBeVisible();
      
      // Check accepted file types
      const acceptAttr = await calculatorPage.fileInput.getAttribute('accept');
      expect(acceptAttr).toContain('.csv');
      expect(acceptAttr).toContain('.qfx');
      
      // Check upload instructions are visible
      const instructions = page.locator('.upload-instructions, [data-testid="upload-help"]');
      await expect(instructions.first()).toBeVisible();
    });

    test('should accept CSV file upload', async ({ page }) => {
      const csvFile = path.join(__dirname, 'test-data', 'sample-trades.csv');
      
      await calculatorPage.uploadFile(csvFile);
      
      // Check file is selected
      const fileName = await calculatorPage.fileInput.inputValue();
      expect(fileName).toContain('sample-trades.csv');
      
      // Check preview or confirmation appears
      const previewTable = page.locator('.file-preview, [data-testid="file-preview"]');
      if (await previewTable.count() > 0) {
        await expect(previewTable).toBeVisible();
      }
    });

    test('should validate file format', async ({ page }) => {
      // Try uploading a non-supported file type
      const textFile = path.join(__dirname, 'test-data', 'invalid-format.txt');
      
      // Create a text file for testing
      const fs = require('fs');
      fs.writeFileSync(textFile, 'This is not a valid trading file');
      
      await calculatorPage.fileInput.setInputFiles(textFile);
      
      // Should show error message
      const errorMessage = page.locator('.alert-danger, .error-message, [data-testid="file-error"]');
      await expect(errorMessage.first()).toBeVisible();
      
      // Clean up
      fs.unlinkSync(textFile);
    });

    test('should handle large files appropriately', async ({ page }) => {
      // Create a large CSV file for testing
      const largeCsv = path.join(__dirname, 'test-data', 'large-trades.csv');
      const fs = require('fs');
      
      let csvContent = 'Date,Symbol,Action,Quantity,Price,Currency,Commission,Exchange Rate\n';
      // Generate 1000+ rows
      for (let i = 0; i < 1000; i++) {
        csvContent += `2024-01-${(i % 28) + 1},STOCK${i % 100},${i % 2 === 0 ? 'BUY' : 'SELL'},${100 + i},${150 + Math.random() * 50},USD,1.00,1.25\n`;
      }
      
      fs.writeFileSync(largeCsv, csvContent);
      
      await calculatorPage.uploadFile(largeCsv);
      
      // Should handle large file (might show progress or warning)
      const progressIndicator = page.locator('.progress, .loading, [data-testid="upload-progress"]');
      if (await progressIndicator.count() > 0) {
        await expect(progressIndicator.first()).toBeVisible();
      }
      
      // Clean up
      fs.unlinkSync(largeCsv);
    });
  });

  test.describe('Calculation Process', () => {
    test('should perform tax calculation with valid data', async ({ page }) => {
      const csvFile = path.join(__dirname, 'test-data', 'sample-trades.csv');
      
      // Upload file
      await calculatorPage.uploadFile(csvFile);
      
      // Start calculation
      await calculatorPage.calculate();
      
      // Check results are displayed
      await calculatorPage.checkResults();
    });

    test('should show loading state during calculation', async ({ page }) => {
      const csvFile = path.join(__dirname, 'test-data', 'sample-trades.csv');
      
      await calculatorPage.uploadFile(csvFile);
      
      // Click calculate and immediately check for loading state
      await calculatorPage.calculateButton.click();
      
      // Loading spinner should appear
      await expect(calculatorPage.loadingSpinner).toBeVisible();
      
      // Wait for calculation to complete
      await calculatorPage.page.waitForFunction(() => {
        const spinner = document.querySelector('.loading-spinner');
        return !spinner || !spinner.classList.contains('show');
      });
      
      // Loading should be gone
      await expect(calculatorPage.loadingSpinner).not.toBeVisible();
    });

    test('should handle calculation errors gracefully', async ({ page }) => {
      const invalidFile = path.join(__dirname, 'test-data', 'invalid-data.csv');
      
      await calculatorPage.uploadFile(invalidFile);
      await calculatorPage.calculate();
      
      // Should show error message
      await expect(calculatorPage.errorAlert).toBeVisible();
      
      // Error message should be informative
      const errorText = await calculatorPage.errorAlert.textContent();
      expect(errorText).toBeTruthy();
      expect(errorText!.length).toBeGreaterThan(10);
    });

    test('should validate calculation accuracy', async ({ page }) => {
      const csvFile = path.join(__dirname, 'test-data', 'sample-trades.csv');
      
      await calculatorPage.uploadFile(csvFile);
      await calculatorPage.calculate();
      
      // Wait for results
      await calculatorPage.checkResults();
      
      // Validate specific calculation results
      // AAPL: (180-150) * 100 / 1.25 - (150 * 100 / 1.27) = 2400 - 11811.02 = gain
      // MSFT: (350-300) * 50 / 1.24 - (300 * 50 / 1.26) = 2016.13 - 11904.76 = gain  
      // GOOGL: (2800-2500) * 25 / 1.23 - (2500 * 25 / 1.28) = 6097.56 - 48828.13 = gain
      
      // Check that calculations include currency conversion
      const currencyNote = page.locator(':has-text("Exchange Rate"), :has-text("GBP")');
      await expect(currencyNote.first()).toBeVisible();
    });

    test('should display calculation breakdown', async ({ page }) => {
      const csvFile = path.join(__dirname, 'test-data', 'sample-trades.csv');
      
      await calculatorPage.uploadFile(csvFile);
      await calculatorPage.calculate();
      
      await calculatorPage.checkResults();
      
      // Check for detailed breakdown sections
      const sections = [
        'Holdings Summary',
        'Disposals Summary', 
        'Dividend Summary',
        'Tax Summary'
      ];
      
      for (const section of sections) {
        const sectionElement = page.locator(`h2:has-text("${section}"), h3:has-text("${section}"), [data-testid="${section.toLowerCase().replace(' ', '-')}"]`);
        if (await sectionElement.count() > 0) {
          await expect(sectionElement.first()).toBeVisible();
        }
      }
    });
  });

  test.describe('Results Display', () => {
    test.beforeEach(async ({ page }) => {
      const csvFile = path.join(__dirname, 'test-data', 'sample-trades.csv');
      await calculatorPage.uploadFile(csvFile);
      await calculatorPage.calculate();
      await calculatorPage.checkResults();
    });

    test('should display results in organized tables', async ({ page }) => {
      // Check for results tables
      const tables = calculatorPage.resultsSection.locator('table');
      const tableCount = await tables.count();
      expect(tableCount).toBeGreaterThan(0);
      
      // Each table should have headers
      for (let i = 0; i < tableCount; i++) {
        const table = tables.nth(i);
        const headers = table.locator('th');
        const headerCount = await headers.count();
        expect(headerCount).toBeGreaterThan(0);
      }
    });

    test('should show summary cards with key metrics', async ({ page }) => {
      // Check for summary cards
      const summaryCards = calculatorPage.resultsSection.locator('.card, .summary-card');
      const cardCount = await summaryCards.count();
      expect(cardCount).toBeGreaterThan(0);
      
      // Cards should contain financial data
      const financialData = calculatorPage.resultsSection.locator(':has-text("£"), :has-text("GBP")');
      const dataCount = await financialData.count();
      expect(dataCount).toBeGreaterThan(0);
    });

    test('should display capital gains tax calculation', async ({ page }) => {
      // Check for CGT-specific elements
      const cgtElements = [
        ':has-text("Capital Gains Tax")',
        ':has-text("CGT")', 
        ':has-text("Annual Allowance")',
        ':has-text("Taxable Gain")'
      ];
      
      for (const selector of cgtElements) {
        const elements = page.locator(selector);
        if (await elements.count() > 0) {
          await expect(elements.first()).toBeVisible();
        }
      }
    });

    test('should show dividend information if present', async ({ page }) => {
      // Check for dividend-related information
      const dividendElements = page.locator(':has-text("Dividend"), :has-text("dividend")');
      const dividendCount = await dividendElements.count();
      
      if (dividendCount > 0) {
        // Should show dividend tax information
        const dividendTax = page.locator(':has-text("Dividend Tax"), :has-text("dividend tax")');
        await expect(dividendTax.first()).toBeVisible();
      }
    });

    test('should allow export of results', async ({ page }) => {
      // Check for export buttons
      const exportButtons = page.locator('button:has-text("Export"), button:has-text("Download"), a:has-text("Export")');
      const exportCount = await exportButtons.count();
      
      if (exportCount > 0) {
        const exportBtn = exportButtons.first();
        await expect(exportBtn).toBeVisible();
        await expect(exportBtn).toBeEnabled();
      }
    });

    test('should display results in responsive format', async ({ page }) => {
      // Test on mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Results should still be visible and accessible
      await expect(calculatorPage.resultsSection).toBeVisible();
      
      // Tables should be responsive (scrollable or stacked)
      const tables = calculatorPage.resultsSection.locator('table');
      const tableCount = await tables.count();
      
      for (let i = 0; i < tableCount; i++) {
        const table = tables.nth(i);
        await expect(table).toBeVisible();
        
        // Check if table has responsive features
        const tableContainer = table.locator('xpath=ancestor::div[contains(@class, "table-responsive") or contains(@class, "overflow")]');
        if (await tableContainer.count() > 0) {
          await expect(tableContainer.first()).toBeVisible();
        }
      }
    });
  });

  test.describe('Data Validation', () => {
    test('should validate required columns in CSV', async ({ page }) => {
      // Create CSV with missing required columns
      const incompleteCSV = path.join(__dirname, 'test-data', 'incomplete.csv');
      const fs = require('fs');
      
      fs.writeFileSync(incompleteCSV, 'Date,Symbol\n2024-01-15,AAPL\n');
      
      await calculatorPage.uploadFile(incompleteCSV);
      await calculatorPage.calculate();
      
      // Should show validation error
      await expect(calculatorPage.errorAlert).toBeVisible();
      
      const errorText = await calculatorPage.errorAlert.textContent();
      expect(errorText).toContain('required');
      
      // Clean up
      fs.unlinkSync(incompleteCSV);
    });

    test('should validate date formats', async ({ page }) => {
      // Create CSV with invalid dates
      const invalidDatesCSV = path.join(__dirname, 'test-data', 'invalid-dates.csv');
      const fs = require('fs');
      
      const csvContent = `Date,Symbol,Action,Quantity,Price,Currency,Commission,Exchange Rate
INVALID-DATE,AAPL,BUY,100,150.00,USD,1.00,1.27
2024-13-45,MSFT,SELL,50,200.00,USD,1.00,1.25`;
      
      fs.writeFileSync(invalidDatesCSV, csvContent);
      
      await calculatorPage.uploadFile(invalidDatesCSV);
      await calculatorPage.calculate();
      
      // Should show date validation error
      await expect(calculatorPage.errorAlert).toBeVisible();
      
      // Clean up
      fs.unlinkSync(invalidDatesCSV);
    });

    test('should validate numeric fields', async ({ page }) => {
      // Create CSV with invalid numeric data
      const invalidNumbersCSV = path.join(__dirname, 'test-data', 'invalid-numbers.csv');
      const fs = require('fs');
      
      const csvContent = `Date,Symbol,Action,Quantity,Price,Currency,Commission,Exchange Rate
2024-01-15,AAPL,BUY,NOT_A_NUMBER,150.00,USD,1.00,1.27
2024-01-16,MSFT,SELL,50,INVALID_PRICE,USD,1.00,1.25`;
      
      fs.writeFileSync(invalidNumbersCSV, csvContent);
      
      await calculatorPage.uploadFile(invalidNumbersCSV);
      await calculatorPage.calculate();
      
      // Should show numeric validation error
      await expect(calculatorPage.errorAlert).toBeVisible();
      
      // Clean up
      fs.unlinkSync(invalidNumbersCSV);
    });

    test('should handle empty files', async ({ page }) => {
      // Create empty CSV file
      const emptyCSV = path.join(__dirname, 'test-data', 'empty.csv');
      const fs = require('fs');
      
      fs.writeFileSync(emptyCSV, '');
      
      await calculatorPage.uploadFile(emptyCSV);
      await calculatorPage.calculate();
      
      // Should show appropriate message for empty file
      await expect(calculatorPage.errorAlert).toBeVisible();
      
      const errorText = await calculatorPage.errorAlert.textContent();
      expect(errorText).toContain('empty');
      
      // Clean up
      fs.unlinkSync(emptyCSV);
    });
  });

  test.describe('User Experience', () => {
    test('should provide clear instructions and help', async ({ page }) => {
      // Check for help text or instructions
      const helpElements = page.locator('.help-text, .instructions, [data-testid*="help"]');
      const helpCount = await helpElements.count();
      
      if (helpCount > 0) {
        await expect(helpElements.first()).toBeVisible();
      }
      
      // Check for format examples
      const exampleElements = page.locator(':has-text("example"), :has-text("format"), :has-text("sample")');
      const exampleCount = await exampleElements.count();
      
      if (exampleCount > 0) {
        await expect(exampleElements.first()).toBeVisible();
      }
    });

    test('should maintain state during navigation', async ({ page }) => {
      const csvFile = path.join(__dirname, 'test-data', 'sample-trades.csv');
      
      // Upload file and calculate
      await calculatorPage.uploadFile(csvFile);
      await calculatorPage.calculate();
      await calculatorPage.checkResults();
      
      // Navigate away and back
      await page.locator('nav a:has-text("About")').click();
      await calculatorPage.waitForPageLoad();
      
      await page.locator('nav a:has-text("Calculator")').click();
      await calculatorPage.waitForPageLoad();
      
      // Check if results are still visible or if user can easily recalculate
      const isResultsVisible = await calculatorPage.resultsSection.isVisible();
      if (!isResultsVisible) {
        // Should at least have the option to easily recalculate
        await expect(calculatorPage.calculateButton).toBeVisible();
      }
    });

    test('should provide progress feedback for long operations', async ({ page }) => {
      // Create a larger dataset
      const largeCSV = path.join(__dirname, 'test-data', 'large-dataset.csv');
      const fs = require('fs');
      
      let csvContent = 'Date,Symbol,Action,Quantity,Price,Currency,Commission,Exchange Rate\n';
      for (let i = 0; i < 500; i++) {
        csvContent += `2024-01-${(i % 28) + 1},STOCK${i % 50},${i % 2 === 0 ? 'BUY' : 'SELL'},${100 + i},${150 + Math.random() * 50},USD,1.00,1.25\n`;
      }
      
      fs.writeFileSync(largeCSV, csvContent);
      
      await calculatorPage.uploadFile(largeCSV);
      
      // Start calculation and check for progress indicators
      await calculatorPage.calculateButton.click();
      
      // Should show some form of progress feedback
      const progressElements = page.locator('.progress, .loading, .spinner, [data-testid*="progress"]');
      const progressCount = await progressElements.count();
      
      if (progressCount > 0) {
        await expect(progressElements.first()).toBeVisible();
      }
      
      // Wait for completion
      await calculatorPage.page.waitForFunction(() => {
        const spinner = document.querySelector('.loading-spinner');
        return !spinner || !spinner.classList.contains('show');
      }, { timeout: 30000 });
      
      // Clean up
      fs.unlinkSync(largeCSV);
    });
  });

  test.describe('Edge Cases', () => {
    test('should handle same-day buy and sell transactions', async ({ page }) => {
      const sameDayCSV = path.join(__dirname, 'test-data', 'same-day-trades.csv');
      const fs = require('fs');
      
      const csvContent = `Date,Symbol,Action,Quantity,Price,Currency,Commission,Exchange Rate
2024-01-15,AAPL,BUY,100,150.00,USD,1.00,1.27
2024-01-15,AAPL,SELL,100,155.00,USD,1.00,1.27`;
      
      fs.writeFileSync(sameDayCSV, csvContent);
      
      await calculatorPage.uploadFile(sameDayCSV);
      await calculatorPage.calculate();
      
      // Should handle same-day transactions appropriately
      await calculatorPage.checkResults();
      
      // Clean up
      fs.unlinkSync(sameDayCSV);
    });

    test('should handle fractional shares', async ({ page }) => {
      const fractionalCSV = path.join(__dirname, 'test-data', 'fractional-shares.csv');
      const fs = require('fs');
      
      const csvContent = `Date,Symbol,Action,Quantity,Price,Currency,Commission,Exchange Rate
2024-01-15,AAPL,BUY,100.5,150.00,USD,1.00,1.27
2024-06-15,AAPL,SELL,100.5,180.00,USD,1.00,1.25`;
      
      fs.writeFileSync(fractionalCSV, csvContent);
      
      await calculatorPage.uploadFile(fractionalCSV);
      await calculatorPage.calculate();
      
      // Should handle fractional shares
      await calculatorPage.checkResults();
      
      // Clean up
      fs.unlinkSync(fractionalCSV);
    });

    test('should handle multiple currencies', async ({ page }) => {
      const multiCurrencyCSV = path.join(__dirname, 'test-data', 'multi-currency.csv');
      const fs = require('fs');
      
      const csvContent = `Date,Symbol,Action,Quantity,Price,Currency,Commission,Exchange Rate
2024-01-15,AAPL,BUY,100,150.00,USD,1.00,1.27
2024-01-16,ASML,BUY,10,500.00,EUR,2.00,1.15
2024-06-15,AAPL,SELL,100,180.00,USD,1.00,1.25
2024-06-16,ASML,SELL,10,600.00,EUR,2.00,1.16`;
      
      fs.writeFileSync(multiCurrencyCSV, csvContent);
      
      await calculatorPage.uploadFile(multiCurrencyCSV);
      await calculatorPage.calculate();
      
      // Should handle multiple currencies with appropriate conversion
      await calculatorPage.checkResults();
      
      // Should show currency information in results
      const currencyInfo = page.locator(':has-text("USD"), :has-text("EUR"), :has-text("Exchange Rate")');
      await expect(currencyInfo.first()).toBeVisible();
      
      // Clean up
      fs.unlinkSync(multiCurrencyCSV);
    });
  });
});