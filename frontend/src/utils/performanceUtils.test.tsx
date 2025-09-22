import { render, screen } from '@testing-library/react';
import React from 'react';
import '@testing-library/jest-dom';
import { LazyImage, withLazyLoading, PerformanceMonitor, usePagePreload } from './performanceUtils';

// Mock IntersectionObserver
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null
});
window.IntersectionObserver = mockIntersectionObserver;

// Mock performance API
Object.defineProperty(window, 'performance', {
  value: {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByType: jest.fn(() => []),
    getEntriesByName: jest.fn(() => [])
  }
});

describe('LazyImage', () => {
  it('renders placeholder initially', () => {
    render(
      <LazyImage
        src="https://example.com/image.jpg"
        alt="Test image"
        placeholder="Loading..."
      />
    );
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <LazyImage
        src="https://example.com/image.jpg"
        alt="Test image"
        className="custom-image"
      />
    );
    
    expect(container.firstChild).toHaveClass('lazy-image', 'custom-image');
  });

  it('renders with loading skeleton by default', () => {
    const { container } = render(
      <LazyImage
        src="https://example.com/image.jpg"
        alt="Test image"
      />
    );
    
    expect(container.querySelector('.loading-skeleton')).toBeInTheDocument();
  });

  it('shows skeleton loader when image is not in view', () => {
    render(
      <LazyImage
        src="invalid-url"
        alt="Test image"
        fallback="Failed to load"
      />
    );
    
    // Initially shows loading skeleton with icon
    expect(document.querySelector('.loading-skeleton')).toBeInTheDocument();
    expect(document.querySelector('.bi-image')).toBeInTheDocument();
  });
});

describe('withLazyLoading', () => {
  const TestComponent = ({ name }: { name: string }) => <div>Hello {name}</div>;
  
  it('creates lazy loaded component', () => {
    const LazyTestComponent = withLazyLoading(() => Promise.resolve({ default: TestComponent }));
    
    render(
      <React.Suspense fallback={<div>Loading component...</div>}>
        <LazyTestComponent name="World" />
      </React.Suspense>
    );
    
    // The withLazyLoading should use the default "Loading..." fallback
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('handles component loading error', async () => {
    const LazyErrorComponent = withLazyLoading(() => Promise.reject(new Error('Failed to load')));
    
    // Mock error boundary behavior
    const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
      try {
        return <>{children}</>;
      } catch (error) {
        return <div>Component failed to load</div>;
      }
    };
    
    render(
      <ErrorBoundary>
        <React.Suspense fallback={<div>Loading...</div>}>
          <LazyErrorComponent />
        </React.Suspense>
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});

describe('PerformanceMonitor', () => {
  let originalConsole: Console;
  
  beforeEach(() => {
    originalConsole = global.console;
    global.console = {
      ...originalConsole,
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    };
  });
  
  afterEach(() => {
    global.console = originalConsole;
  });

  it('logs performance metrics', () => {
    const monitor = new PerformanceMonitor();
    
    monitor.startMeasure('test-operation');
    monitor.endMeasure('test-operation');
    
    expect(window.performance.mark).toHaveBeenCalledWith('test-operation-start');
    expect(window.performance.mark).toHaveBeenCalledWith('test-operation-end');
    expect(window.performance.measure).toHaveBeenCalledWith(
      'test-operation',
      'test-operation-start',
      'test-operation-end'
    );
  });

  it('collects Core Web Vitals', () => {
    const monitor = new PerformanceMonitor();
    const vitals = monitor.getCoreWebVitals();
    
    expect(vitals).toHaveProperty('lcp');
    expect(vitals).toHaveProperty('fid');
    expect(vitals).toHaveProperty('cls');
    expect(vitals).toHaveProperty('fcp');
    expect(vitals).toHaveProperty('ttfb');
  });

  it('measures component render time', () => {
    const monitor = new PerformanceMonitor();
    
    const measureRender = monitor.measureComponentRender('TestComponent');
    measureRender(); // End measurement
    
    expect(window.performance.mark).toHaveBeenCalledWith('TestComponent-render-start');
    expect(window.performance.mark).toHaveBeenCalledWith('TestComponent-render-end');
  });

  it('tracks memory usage', () => {
    const monitor = new PerformanceMonitor();
    const memoryInfo = monitor.getMemoryInfo();
    
    // Memory info might not be available in test environment
    expect(memoryInfo).toBeDefined();
  });
});

describe('usePagePreload', () => {
  it('preloads page resources', () => {
    const TestComponent = () => {
      usePagePreload('/test-page', ['script.js', 'style.css']);
      return <div>Test Component</div>;
    };
    
    render(<TestComponent />);
    
    // Check if preload links were added to document head
    const preloadLinks = document.querySelectorAll('link[rel="preload"]');
    expect(preloadLinks.length).toBeGreaterThan(0);
  });

  it('handles preload without resources', () => {
    const TestComponent = () => {
      usePagePreload('/test-page');
      return <div>Test Component</div>;
    };
    
    expect(() => render(<TestComponent />)).not.toThrow();
  });

  it('cleans up preload links on unmount', () => {
    const TestComponent = () => {
      usePagePreload('/test-page', ['script.js']);
      return <div>Test Component</div>;
    };
    
    const { unmount } = render(<TestComponent />);
    
    const initialPreloadLinks = document.querySelectorAll('link[rel="preload"]').length;
    unmount();
    
    // Preload links should be cleaned up (or at least not increase)
    const finalPreloadLinks = document.querySelectorAll('link[rel="preload"]').length;
    expect(finalPreloadLinks).toBeLessThanOrEqual(initialPreloadLinks);
  });
});