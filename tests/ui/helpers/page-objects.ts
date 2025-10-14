import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for common UI elements and actions
 */
export class BasePage {
  readonly page: Page;
  readonly navigation: Locator;
  readonly mobileMenuToggle: Locator;
  readonly footer: Locator;

  constructor(page: Page) {
    this.page = page;
    this.navigation = page.locator('nav, [role="navigation"]');
    this.mobileMenuToggle = page.locator('.navbar-toggler, .menu-toggle, button[aria-expanded]');
    this.footer = page.locator('footer');
  }

  async goto(path: string = '') {
    // Normalize path - handle empty, root, and paths with/without leading slash
    let url = '/';
    if (path && path !== '/') {
      url = path.startsWith('/') ? path : `/${path}`;
    }
    await this.page.goto(url);
  }

  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
    
    // Handle cookie consent dialog if present
    await this.dismissCookieConsent();
    
    await this.page.waitForTimeout(1000); // Additional wait for dynamic content
  }

  async dismissCookieConsent() {
    try {
      // Quick check for consent dialog without long waits
      await this.page.waitForTimeout(500);
      
      // Immediately try to dismiss with JavaScript first (fastest approach)
      await this.page.evaluate(() => {
        // Remove overlays that block interaction
        const overlay = document.querySelector('.fc-dialog-overlay');
        if (overlay) overlay.remove();
        
        const consentRoot = document.querySelector('.fc-consent-root');
        if (consentRoot) consentRoot.remove();
        
        // Try to click any visible consent buttons
        const buttons = document.querySelectorAll('button');
        for (const button of buttons) {
          const text = button.textContent?.toLowerCase() || '';
          if (text.includes('accept') || text.includes('agree') || text.includes('allow') || text.includes('ok')) {
            button.click();
            break;
          }
        }
      });
      
      // Short wait to let any JS consent handling complete
      await this.page.waitForTimeout(500);
      
    } catch (error) {
      // Ignore consent handling errors - don't let them break tests
    }
  }

  async checkAccessibility() {
    // Check for basic accessibility attributes
    const headings = await this.page.locator('h1, h2, h3, h4, h5, h6').count();
    expect(headings).toBeGreaterThan(0);
    
    // Check for alt text on images
    const images = this.page.locator('img');
    const imageCount = await images.count();
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      expect(alt).toBeTruthy();
    }
  }

  async checkNavigation() {
    // Check main navigation is present
    const navCount = await this.navigation.count();
    if (navCount > 0) {
      await expect(this.navigation.first()).toBeVisible();
      
      // Check for navigation links
      const navLinks = this.navigation.first().locator('a');
      const linkCount = await navLinks.count();
      expect(linkCount).toBeGreaterThan(0);
    } else {
      // Fallback: check for any navigation-like structure
      const anyNav = this.page.locator('nav, .navbar, .navigation, .nav');
      await expect(anyNav.first()).toBeVisible();
    }
  }

  async checkFooter() {
    await expect(this.footer).toBeVisible();
    
    // Check for footer links
    const footerLinks = this.footer.locator('a');
    const linkCount = await footerLinks.count();
    expect(linkCount).toBeGreaterThan(0);
  }

  async checkMobileMenu() {
    // On mobile, check hamburger menu
    const isMobile = await this.page.evaluate(() => window.innerWidth < 992);
    
    if (isMobile) {
      const toggleCount = await this.mobileMenuToggle.count();
      if (toggleCount > 0 && await this.mobileMenuToggle.first().isVisible()) {
        await this.mobileMenuToggle.first().click();
        
        // Check if menu opens (try different selectors)
        const mobileMenuSelectors = ['.navbar-collapse', '.mobile-menu', '.nav-menu', '.menu-content'];
        let menuFound = false;
        
        for (const selector of mobileMenuSelectors) {
          const menu = this.page.locator(selector);
          if (await menu.count() > 0) {
            await expect(menu.first()).toBeVisible();
            menuFound = true;
            break;
          }
        }
        
        if (menuFound) {
          // Close menu
          await this.mobileMenuToggle.first().click();
        }
      }
    }
  }

  async checkSEOTags() {
    // Check for essential SEO meta tags
    const title = await this.page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(5);
    
    // Check for description (flexible - may not exist on all pages)
    const descriptionElement = this.page.locator('meta[name="description"]');
    const descCount = await descriptionElement.count();
    if (descCount > 0) {
      const description = await descriptionElement.getAttribute('content');
      if (description) {
        expect(description.length).toBeGreaterThan(10);
      }
    }
    
    // Check for Open Graph tags (flexible - may not exist on all pages)
    const ogTitleElement = this.page.locator('meta[property="og:title"]');
    const ogTitleCount = await ogTitleElement.count();
    if (ogTitleCount > 0) {
      const ogTitle = await ogTitleElement.getAttribute('content');
      expect(ogTitle).toBeTruthy();
    }
    
    const ogDescElement = this.page.locator('meta[property="og:description"]');
    const ogDescCount = await ogDescElement.count();
    if (ogDescCount > 0) {
      const ogDescription = await ogDescElement.getAttribute('content');
      expect(ogDescription).toBeTruthy();
    }
  }
}

/**
 * Calculator Page Object Model
 */
export class CalculatorPage extends BasePage {
  readonly fileInput: Locator;
  readonly uploadButton: Locator;
  readonly calculateButton: Locator;
  readonly resultsSection: Locator;
  readonly loadingSpinner: Locator;
  readonly errorAlert: Locator;

  constructor(page: Page) {
    super(page);
    this.fileInput = page.locator('input[type="file"]');
    this.uploadButton = page.locator('button:has-text("Upload")');
    this.calculateButton = page.locator('button:has-text("Calculate")');
    this.resultsSection = page.locator('[data-testid="results-section"]');
    this.loadingSpinner = page.locator('.loading-spinner');
    this.errorAlert = page.locator('.alert-danger');
  }

  async uploadFile(filePath: string) {
    await this.fileInput.setInputFiles(filePath);
    if (await this.uploadButton.isVisible()) {
      await this.uploadButton.click();
    }
  }

  async calculate() {
    await this.calculateButton.click();
    
    // Wait for calculation to complete
    await this.page.waitForFunction(() => {
      const spinner = document.querySelector('.loading-spinner');
      return !spinner || !spinner.classList.contains('show');
    });
  }

  async checkResults() {
    await expect(this.resultsSection).toBeVisible();
    
    // Check for results tables
    const tables = this.resultsSection.locator('table');
    const tableCount = await tables.count();
    expect(tableCount).toBeGreaterThan(0);
    
    // Check for summary cards
    const summaryCards = this.resultsSection.locator('.card');
    const cardCount = await summaryCards.count();
    expect(cardCount).toBeGreaterThan(0);
  }

  async checkCalculationAccuracy(expectedTotal: number, tolerance: number = 0.01) {
    const totalElement = this.resultsSection.locator('[data-testid="total-cgt"]');
    await expect(totalElement).toBeVisible();
    
    const totalText = await totalElement.textContent();
    const actualTotal = parseFloat(totalText!.replace(/[£,]/g, ''));
    expect(Math.abs(actualTotal - expectedTotal)).toBeLessThan(tolerance);
  }
}

/**
 * Blog Page Object Model
 */
export class BlogPage extends BasePage {
  readonly blogPosts: Locator;
  readonly searchInput: Locator;
  readonly categoryFilter: Locator;
  readonly pagination: Locator;

  constructor(page: Page) {
    super(page);
    this.blogPosts = page.locator('[data-testid="blog-post"]');
    this.searchInput = page.locator('input[placeholder*="Search"]');
    this.categoryFilter = page.locator('select[data-testid="category-filter"]');
    this.pagination = page.locator('.pagination');
  }

  async searchBlog(searchTerm: string) {
    await this.searchInput.fill(searchTerm);
    await this.searchInput.press('Enter');
    await this.waitForPageLoad();
  }

  async filterByCategory(category: string) {
    await this.categoryFilter.selectOption(category);
    await this.waitForPageLoad();
  }

  async checkBlogPostStructure() {
    const posts = await this.blogPosts.count();
    expect(posts).toBeGreaterThan(0);
    
    // Check first post structure
    const firstPost = this.blogPosts.first();
    await expect(firstPost.locator('h2, h3')).toBeVisible(); // Title
    await expect(firstPost.locator('.post-meta')).toBeVisible(); // Meta info
    await expect(firstPost.locator('.post-excerpt')).toBeVisible(); // Excerpt
  }
}

/**
 * Test Data Factory
 */
export class TestDataFactory {
  static createTestCSV(): string {
    return `Date,Symbol,Action,Quantity,Price,Currency,Commission
2024-01-15,AAPL,BUY,100,150.00,USD,1.00
2024-06-15,AAPL,SELL,100,180.00,USD,1.00
2024-02-01,MSFT,BUY,50,300.00,USD,1.00
2024-07-01,MSFT,SELL,50,350.00,USD,1.00`;
  }

  static createTestQFX(): string {
    return `OFXHEADER:100
!Type:Invst
D01/15/2024
NAAPL
ABuy
Q100
U150.00
I150.00
^
D06/15/2024
NAAPL
ASell
Q-100
U180.00
I-18000.00
^`;
  }

  static async createTestFile(content: string, filename: string): Promise<string> {
    const fs = require('fs');
    const path = require('path');
    const testDataDir = path.join(__dirname, '../test-data');
    
    if (!fs.existsSync(testDataDir)) {
      fs.mkdirSync(testDataDir, { recursive: true });
    }
    
    const filePath = path.join(testDataDir, filename);
    fs.writeFileSync(filePath, content);
    return filePath;
  }
}

/**
 * Performance utilities
 */
export class PerformanceHelper {
  static async measurePageLoad(page: Page): Promise<number> {
    const startTime = Date.now();
    await page.waitForLoadState('networkidle');
    return Date.now() - startTime;
  }

  static async getCoreWebVitals(page: Page) {
    return await page.evaluate(() => {
      return new Promise((resolve) => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const vitals: any = {};
          
          entries.forEach((entry: any) => {
            if (entry.name === 'FCP') vitals.fcp = entry.value;
            if (entry.name === 'LCP') vitals.lcp = entry.value;
            if (entry.name === 'CLS') vitals.cls = entry.value;
            if (entry.name === 'FID') vitals.fid = entry.value;
          });
          
          resolve(vitals);
        });
        
        observer.observe({ type: 'measure', buffered: true });
        observer.observe({ type: 'layout-shift', buffered: true });
        
        // Fallback timeout
        setTimeout(() => resolve({}), 5000);
      });
    });
  }

  static async checkLighthouseMetrics(page: Page) {
    // Basic performance checks that can be done in Playwright
    const paintTimings = await page.evaluate(() => {
      const paintEntries = performance.getEntriesByType('paint');
      const result: any = {};
      paintEntries.forEach(entry => {
        result[entry.name] = entry.startTime;
      });
      return result;
    });
    
    return paintTimings;
  }
}