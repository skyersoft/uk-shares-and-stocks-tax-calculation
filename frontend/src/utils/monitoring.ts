/**
 * Epic 8: Deployment & Migration
 * Simple Application Monitoring & Deployment Utilities
 */

// Simple error tracking for production
export const trackError = (error: Error, context: Record<string, any> = {}) => {
  console.error('Application Error:', error.message, context);
  
  // Store in session storage for debugging
  try {
    const errorLog = JSON.parse(sessionStorage.getItem('error_log') || '[]');
    errorLog.push({
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
    });
    
    // Keep only last 10 errors
    if (errorLog.length > 10) {
      errorLog.splice(0, errorLog.length - 10);
    }
    
    sessionStorage.setItem('error_log', JSON.stringify(errorLog));
  } catch (e) {
    // Ignore if storage is full
  }
};

// Performance tracking
export const trackCalculationPerformance = (duration: number, fileSize: number, recordCount: number) => {
  console.log(`Tax calculation completed in ${duration}ms`, {
    fileSize,
    recordCount,
    performance: {
      duration,
      recordsPerSecond: Math.round(recordCount / (duration / 1000)),
    },
  });
};

// Health check for deployment
export const getApplicationHealth = () => {
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: performance.now(),
  };
};

// Initialize basic error handling
export const initMonitoring = () => {
  if (typeof window === 'undefined') return;
  
  // Global error handler
  window.addEventListener('error', (event) => {
    trackError(new Error(event.message), {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });
  
  // Unhandled promise rejection handler
  window.addEventListener('unhandledrejection', (event) => {
    trackError(new Error(String(event.reason)), {
      type: 'unhandled_promise',
    });
  });
  
  console.log('✅ Basic monitoring initialized');
};

// Production deployment utilities
export const deploymentUtils = {
  // Check if running in production
  isProduction: () => process.env.NODE_ENV === 'production',
  
  // Get deployment environment
  getEnvironment: () => process.env.NODE_ENV || 'development',
  
  // Log deployment status
  logDeploymentStatus: (status: 'starting' | 'ready' | 'error', details?: any) => {
    console.log(`🚀 Deployment ${status}:`, details);
  },
};