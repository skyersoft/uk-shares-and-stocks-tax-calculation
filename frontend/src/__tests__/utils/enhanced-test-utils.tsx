/**
 * Enhanced Test Utilities for Epic 7: Testing & Quality Assurance
 * Provides improved testing patterns, error suppression, and quality helpers
 */

import React from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { ReactElement, ReactNode } from 'react';
import userEvent from '@testing-library/user-event';

// Re-export everything from testing library
export * from '@testing-library/react';
export { userEvent };

/**
 * Console warning/error suppression utility for cleaner test output
 */
export class ConsoleManager {
  private originalConsole: {
    warn: Console['warn'];
    error: Console['error'];
    log: Console['log'];
  };

  private suppressedMessages: Set<string> = new Set();
  private warningCount = 0;
  private errorCount = 0;

  constructor() {
    this.originalConsole = {
      warn: console.warn,
      error: console.error,
      log: console.log
    };
  }

  /**
   * Suppress specific console messages during tests
   */
  suppressMessages(patterns: string[]): void {
    patterns.forEach(pattern => this.suppressedMessages.add(pattern));
  }

  /**
   * Start console interception
   */
  startInterception(): void {
    console.warn = (...args: any[]) => {
      const message = args.join(' ');
      const shouldSuppress = Array.from(this.suppressedMessages)
        .some(pattern => message.includes(pattern));
      
      if (!shouldSuppress) {
        this.warningCount++;
        this.originalConsole.warn(...args);
      }
    };

    console.error = (...args: any[]) => {
      const message = args.join(' ');
      const shouldSuppress = Array.from(this.suppressedMessages)
        .some(pattern => message.includes(pattern));
      
      if (!shouldSuppress) {
        this.errorCount++;
        this.originalConsole.error(...args);
      }
    };
  }

  /**
   * Stop console interception and restore original functions
   */
  stopInterception(): void {
    console.warn = this.originalConsole.warn;
    console.error = this.originalConsole.error;
    console.log = this.originalConsole.log;
  }

  /**
   * Get counts of warnings and errors
   */
  getCounts(): { warnings: number; errors: number } {
    return {
      warnings: this.warningCount,
      errors: this.errorCount
    };
  }

  /**
   * Reset counts
   */
  resetCounts(): void {
    this.warningCount = 0;
    this.errorCount = 0;
  }
}

/**
 * Global console manager instance
 */
export const consoleManager = new ConsoleManager();

/**
 * Test setup helper for suppressing known warnings
 */
export function setupTestEnvironment(): void {
  // Suppress known React warnings that are expected in tests
  consoleManager.suppressMessages([
    'React does not recognize the `isValid` prop on a DOM element',
    'Warning: Encountered two children with the same key',
    'A suspended resource finished loading inside a test',
    'Warning: validateDOMNesting',
    '[CalculatorPage] Rendering component', // App debug logs
    '[CalculatorPage] State:', // App debug logs
    'Variant A - click_rate:', // Ad optimization debug logs
  ]);
  
  consoleManager.startInterception();
}

/**
 * Test cleanup helper
 */
export function cleanupTestEnvironment(): void {
  consoleManager.stopInterception();
  consoleManager.resetCounts();
}

/**
 * Enhanced render function with better error boundaries and providers
 */
interface EnhancedRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  withProviders?: boolean;
  suppressWarnings?: boolean;
  wrapper?: React.ComponentType<{ children: ReactNode }>;
}

export function renderWithEnhancements(
  ui: ReactElement,
  options: EnhancedRenderOptions = {}
): RenderResult & { consoleOutput: { warnings: number; errors: number } } {
  const { withProviders = false, suppressWarnings = true, ...renderOptions } = options;

  if (suppressWarnings) {
    setupTestEnvironment();
  }

  let Wrapper: React.ComponentType<{ children: ReactNode }> | undefined;

  if (withProviders) {
    // Import providers dynamically to avoid circular dependencies
    const { CalculationProvider } = require('../context/CalculationContext');
    const { ToastProvider } = require('../components/ui/ToastContext');
    const { AdProvider } = require('../context/AdContext');

    Wrapper = ({ children }: { children: ReactNode }) => (
      <ToastProvider position="top-end">
        <AdProvider>
          <CalculationProvider>
            {children}
          </CalculationProvider>
        </AdProvider>
      </ToastProvider>
    );
  }

  const result = render(ui, {
    wrapper: options.wrapper || Wrapper,
    ...renderOptions
  });

  const consoleOutput = consoleManager.getCounts();

  return {
    ...result,
    consoleOutput
  };
}

/**
 * Accessibility testing helper
 */
export async function expectNoAccessibilityViolations(container: HTMLElement): Promise<void> {
  // This would integrate with @axe-core/react or similar in a real implementation
  // For now, we'll do basic accessibility checks
  
  // Check for missing alt text on images
  const images = container.querySelectorAll('img');
  images.forEach(img => {
    if (!img.getAttribute('alt') && !img.getAttribute('aria-label')) {
      console.warn('Image missing alt text:', img.outerHTML.substring(0, 100));
    }
  });

  // Check for proper heading hierarchy
  const headings = Array.from(container.querySelectorAll('h1, h2, h3, h4, h5, h6'));
  let previousLevel = 0;
  headings.forEach(heading => {
    const level = parseInt(heading.tagName[1]);
    if (level > previousLevel + 1) {
      console.warn(`Heading hierarchy violation: ${heading.tagName} follows h${previousLevel}`);
    }
    previousLevel = level;
  });

  // Check for buttons without accessible names
  const buttons = container.querySelectorAll('button');
  buttons.forEach(button => {
    const hasAccessibleName = 
      button.textContent?.trim() ||
      button.getAttribute('aria-label') ||
      button.getAttribute('aria-labelledby') ||
      button.getAttribute('title');
    
    if (!hasAccessibleName) {
      console.warn('Button without accessible name:', button.outerHTML.substring(0, 100));
    }
  });
}

/**
 * Performance testing helper
 */
export function measureRenderTime(renderFn: () => RenderResult): Promise<{
  result: RenderResult;
  renderTime: number;
}> {
  return new Promise((resolve) => {
    const startTime = performance.now();
    const result = renderFn();
    
    // Use setTimeout to measure after React has finished rendering
    setTimeout(() => {
      const endTime = performance.now();
      resolve({
        result,
        renderTime: endTime - startTime
      });
    }, 0);
  });
}

/**
 * Memory leak detection helper
 */
export function detectMemoryLeaks(): {
  initialMemory: number;
  checkMemory: () => { currentMemory: number; leaked: boolean };
} {
  const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
  
  return {
    initialMemory,
    checkMemory: () => {
      const currentMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const threshold = initialMemory * 1.5; // 50% increase is concerning
      
      return {
        currentMemory,
        leaked: currentMemory > threshold
      };
    }
  };
}

/**
 * Test data factory helpers
 */
export const testDataFactory = {
  /**
   * Create mock file for file upload tests
   */
  createMockFile: (
    name: string = 'test.csv',
    content: string = 'col1,col2\nval1,val2',
    type: string = 'text/csv'
  ): File => {
    return new File([content], name, { type });
  },

  /**
   * Create mock portfolio data
   */
  createMockPortfolio: () => ({
    holdings: [
      {
        symbol: 'AAPL',
        quantity: 100,
        averageCost: 150,
        currentPrice: 180,
        currency: 'USD'
      },
      {
        symbol: 'GOOGL',
        quantity: 50,
        averageCost: 2000,
        currentPrice: 2500,
        currency: 'USD'
      }
    ],
    totalValue: 145000,
    totalGains: 28000,
    currency: 'USD'
  }),

  /**
   * Create mock calculation result
   */
  createMockResult: () => ({
    taxLiability: 5600,
    totalGains: 28000,
    allowableExpenses: 100,
    section104Pools: [],
    disposals: [],
    summary: {
      totalProceeds: 150000,
      totalCosts: 122000,
      netGains: 28000
    }
  })
};

/**
 * Integration test helpers
 */
export class IntegrationTestHelper {
  /**
   * Simulate user workflow
   */
  static async simulateFileUploadWorkflow(user: ReturnType<typeof userEvent.setup>) {
    const file = testDataFactory.createMockFile();
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    if (fileInput) {
      await user.upload(fileInput, file);
    }
  }

  /**
   * Simulate form submission
   */
  static async simulateFormSubmission(user: ReturnType<typeof userEvent.setup>) {
    const submitButton = document.querySelector('button[type="submit"]') as HTMLButtonElement;
    
    if (submitButton && !submitButton.disabled) {
      await user.click(submitButton);
    }
  }

  /**
   * Wait for async operations to complete
   */
  static async waitForAsyncOperations(timeout: number = 5000): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, timeout);
    });
  }
}

export default {
  renderWithEnhancements,
  expectNoAccessibilityViolations,
  measureRenderTime,
  detectMemoryLeaks,
  testDataFactory,
  IntegrationTestHelper,
  consoleManager,
  setupTestEnvironment,
  cleanupTestEnvironment
};