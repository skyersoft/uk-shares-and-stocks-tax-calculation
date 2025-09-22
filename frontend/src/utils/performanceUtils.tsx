import React, { useState, useEffect, useRef, lazy, ComponentType, Suspense } from 'react';

// Lazy Image Component with Intersection Observer
interface LazyImageProps {
  src: string;
  alt: string;
  placeholder?: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
  width?: number;
  height?: number;
  onLoad?: () => void;
  onError?: () => void;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  placeholder,
  fallback,
  className = '',
  width,
  height,
  onLoad,
  onError
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
    if (onLoad) onLoad();
  };

  const handleError = () => {
    setHasError(true);
    if (onError) onError();
  };

  const defaultSkeleton = (
    <div className="loading-skeleton" style={{ width, height }}>
      <div className="skeleton-pulse bg-light" style={{ width: '100%', height: '200px' }}>
        <div className="d-flex align-items-center justify-content-center h-100 text-muted">
          <i className="bi bi-image" style={{ fontSize: '2rem' }}></i>
        </div>
      </div>
    </div>
  );

  if (hasError && fallback) {
    return <div className={`lazy-image error ${className}`}>{fallback}</div>;
  }

  return (
    <div ref={containerRef} className={`lazy-image ${className}`}>
      {!isInView && (placeholder || defaultSkeleton)}
      {isInView && (
        <>
          {!isLoaded && (placeholder || defaultSkeleton)}
          <img
            ref={imgRef}
            src={src}
            alt={alt}
            width={width}
            height={height}
            onLoad={handleLoad}
            onError={handleError}
            style={{
              display: isLoaded ? 'block' : 'none',
              maxWidth: '100%',
              height: 'auto'
            }}
          />
        </>
      )}
    </div>
  );
};

// Higher-order component for lazy loading
export const withLazyLoading = <P extends object>(
  importFunc: () => Promise<{ default: ComponentType<P> }>,
  fallback?: React.ReactNode
) => {
  const LazyComponent = lazy(importFunc);
  
  return (props: P) => (
    <Suspense fallback={fallback || <div>Loading...</div>}>
      <LazyComponent {...props} />
    </Suspense>
  );
};

// Performance monitoring utility
export class PerformanceMonitor {
  private measurements: Map<string, number> = new Map();

  startMeasure(name: string): void {
    const startMark = `${name}-start`;
    performance.mark(startMark);
    this.measurements.set(name, performance.now());
  }

  endMeasure(name: string): number | undefined {
    const startTime = this.measurements.get(name);
    if (!startTime) {
      console.warn(`No start measurement found for: ${name}`);
      return undefined;
    }

    const endMark = `${name}-end`;
    performance.mark(endMark);
    
    const duration = performance.now() - startTime;
    performance.measure(name, `${name}-start`, endMark);
    
    this.measurements.delete(name);
    return duration;
  }

  measureComponentRender(componentName: string) {
    this.startMeasure(`${componentName}-render`);
    
    return () => {
      const duration = this.endMeasure(`${componentName}-render`);
      if (duration !== undefined) {
        console.log(`${componentName} render time: ${duration.toFixed(2)}ms`);
      }
    };
  }

  getCoreWebVitals() {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    return {
      // Largest Contentful Paint
      lcp: this.getLCP(),
      // First Input Delay
      fid: this.getFID(),
      // Cumulative Layout Shift
      cls: this.getCLS(),
      // First Contentful Paint
      fcp: navigation ? navigation.loadEventEnd - navigation.fetchStart : 0,
      // Time to First Byte
      ttfb: navigation ? navigation.responseStart - navigation.requestStart : 0
    };
  }

  private getLCP(): number {
    const entries = performance.getEntriesByType('largest-contentful-paint');
    return entries.length > 0 ? entries[entries.length - 1].startTime : 0;
  }

  private getFID(): number {
    const entries = performance.getEntriesByType('first-input');
    return entries.length > 0 ? (entries[0] as any).processingStart - entries[0].startTime : 0;
  }

  private getCLS(): number {
    const entries = performance.getEntriesByType('layout-shift');
    return entries.reduce((sum, entry) => {
      if (!(entry as any).hadRecentInput) {
        sum += (entry as any).value;
      }
      return sum;
    }, 0);
  }

  getMemoryInfo() {
    // @ts-ignore - memory API might not be available
    return (performance as any).memory || {
      usedJSHeapSize: 0,
      totalJSHeapSize: 0,
      jsHeapSizeLimit: 0
    };
  }

  logPerformanceMetrics(): void {
    const vitals = this.getCoreWebVitals();
    const memory = this.getMemoryInfo();
    
    console.group('🚀 Performance Metrics');
    console.log('Core Web Vitals:', vitals);
    console.log('Memory Usage:', memory);
    console.log('Resource Timing:', performance.getEntriesByType('resource').slice(0, 10));
    console.groupEnd();
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Hook for preloading resources
export const usePagePreload = (route: string, resources?: string[]) => {
  useEffect(() => {
    const preloadLinks: HTMLLinkElement[] = [];

    if (resources && resources.length > 0) {
      resources.forEach(resource => {
        const link = document.createElement('link');
        link.rel = 'preload';
        
        // Determine resource type
        if (resource.endsWith('.js')) {
          link.as = 'script';
        } else if (resource.endsWith('.css')) {
          link.as = 'style';
        } else if (resource.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
          link.as = 'image';
        } else {
          link.as = 'fetch';
          link.crossOrigin = 'anonymous';
        }
        
        link.href = resource;
        document.head.appendChild(link);
        preloadLinks.push(link);
      });
    }

    // Cleanup on unmount
    return () => {
      preloadLinks.forEach(link => {
        if (document.head.contains(link)) {
          document.head.removeChild(link);
        }
      });
    };
  }, [route, resources]);
};

// Code splitting helper
export const createAsyncChunk = <T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  chunkName?: string
) => {
  return lazy(async () => {
    const start = performance.now();
    
    try {
      const module = await importFunc();
      const loadTime = performance.now() - start;
      
      if (chunkName) {
        console.log(`📦 Chunk "${chunkName}" loaded in ${loadTime.toFixed(2)}ms`);
      }
      
      return module;
    } catch (error) {
      console.error(`❌ Failed to load chunk${chunkName ? ` "${chunkName}"` : ''}:`, error);
      throw error;
    }
  });
};

// Cache utility for API responses
export class CacheManager {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  set(key: string, data: any, ttlMs = 300000): void { // 5 minutes default
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    });
  }

  get(key: string): any {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  clear(): void {
    this.cache.clear();
  }

  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

export const cacheManager = new CacheManager();

// Bundle analyzer helper
export const analyzeBundleSize = () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Bundle analysis would run here in development mode');
    // Bundle analyzer integration would go here
    // This could integrate with webpack-bundle-analyzer or similar tools
  }
};

// Web Workers utility for heavy computations
export const createWorker = (workerFunction: () => void) => {
  const workerScript = `
    self.onmessage = function(e) {
      const result = (${workerFunction.toString()}).call(this, e.data);
      self.postMessage(result);
    };
  `;
  
  const blob = new Blob([workerScript], { type: 'application/javascript' });
  return new Worker(URL.createObjectURL(blob));
};

export default {
  LazyImage,
  withLazyLoading,
  PerformanceMonitor,
  performanceMonitor,
  usePagePreload,
  createAsyncChunk,
  CacheManager,
  cacheManager,
  analyzeBundleSize,
  createWorker
};