/**
 * Test Quality Metrics and Analysis Utilities
 * Epic 7: Testing & Quality Assurance
 */

export interface TestMetrics {
  totalTests: number;
  totalSuites: number;
  coverage: {
    statements: number;
    branches: number;
    functions: number;
    lines: number;
  };
  performance: {
    averageTestTime: number;
    slowestTests: Array<{ name: string; duration: number }>;
    suitePerformance: Record<string, number>;
  };
  quality: {
    warnings: number;
    errors: number;
    deprecations: number;
    accessibilityIssues: number;
  };
}

export interface TestQualityReport {
  timestamp: string;
  version: string;
  metrics: TestMetrics;
  recommendations: Array<{
    category: 'performance' | 'coverage' | 'quality' | 'accessibility';
    severity: 'low' | 'medium' | 'high';
    message: string;
    suggestion: string;
  }>;
}

/**
 * Quality gates for test metrics
 */
export const QUALITY_THRESHOLDS = {
  coverage: {
    statements: 80,
    branches: 75,
    functions: 80,
    lines: 80
  },
  performance: {
    maxTestTime: 5000, // 5 seconds
    maxSuiteTime: 30000, // 30 seconds
    maxSlowTests: 10
  },
  quality: {
    maxWarnings: 0,
    maxErrors: 0,
    maxDeprecations: 0
  }
} as const;

/**
 * Analyze test run results and generate quality report
 */
export function analyzeTestQuality(
  testResults: any,
  coverage?: any,
  performance?: any
): TestQualityReport {
  const metrics: TestMetrics = {
    totalTests: testResults.numTotalTests || 0,
    totalSuites: testResults.numTotalTestSuites || 0,
    coverage: {
      statements: coverage?.total?.statements?.pct || 0,
      branches: coverage?.total?.branches?.pct || 0,
      functions: coverage?.total?.functions?.pct || 0,
      lines: coverage?.total?.lines?.pct || 0
    },
    performance: {
      averageTestTime: performance?.averageTime || 0,
      slowestTests: performance?.slowestTests || [],
      suitePerformance: performance?.suitePerformance || {}
    },
    quality: {
      warnings: performance?.warnings || 0,
      errors: performance?.errors || 0,
      deprecations: performance?.deprecations || 0,
      accessibilityIssues: performance?.accessibilityIssues || 0
    }
  };

  const recommendations = generateRecommendations(metrics);

  return {
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    metrics,
    recommendations
  };
}

/**
 * Generate quality improvement recommendations
 */
function generateRecommendations(metrics: TestMetrics): TestQualityReport['recommendations'] {
  const recommendations: TestQualityReport['recommendations'] = [];

  // Coverage recommendations
  Object.entries(QUALITY_THRESHOLDS.coverage).forEach(([key, threshold]) => {
    const actual = metrics.coverage[key as keyof typeof metrics.coverage];
    if (actual < threshold) {
      recommendations.push({
        category: 'coverage',
        severity: actual < threshold * 0.7 ? 'high' : 'medium',
        message: `${key} coverage is ${actual}%, below threshold of ${threshold}%`,
        suggestion: `Add more tests to improve ${key} coverage. Focus on untested code paths.`
      });
    }
  });

  // Performance recommendations
  if (metrics.performance.averageTestTime > QUALITY_THRESHOLDS.performance.maxTestTime) {
    recommendations.push({
      category: 'performance',
      severity: 'medium',
      message: `Average test time is ${metrics.performance.averageTestTime}ms`,
      suggestion: 'Optimize slow tests, mock heavy dependencies, or parallelize test execution.'
    });
  }

  if (metrics.performance.slowestTests.length > QUALITY_THRESHOLDS.performance.maxSlowTests) {
    recommendations.push({
      category: 'performance',
      severity: 'low',
      message: `${metrics.performance.slowestTests.length} tests are slower than expected`,
      suggestion: 'Review and optimize the slowest running tests.'
    });
  }

  // Quality recommendations
  if (metrics.quality.warnings > QUALITY_THRESHOLDS.quality.maxWarnings) {
    recommendations.push({
      category: 'quality',
      severity: 'medium',
      message: `${metrics.quality.warnings} test warnings detected`,
      suggestion: 'Address console warnings by fixing React prop issues, missing act() wrappers, and deprecated APIs.'
    });
  }

  if (metrics.quality.errors > QUALITY_THRESHOLDS.quality.maxErrors) {
    recommendations.push({
      category: 'quality',
      severity: 'high',
      message: `${metrics.quality.errors} test errors detected`,
      suggestion: 'Fix console errors immediately to ensure test reliability.'
    });
  }

  if (metrics.quality.accessibilityIssues > 0) {
    recommendations.push({
      category: 'accessibility',
      severity: 'medium',
      message: `${metrics.quality.accessibilityIssues} accessibility issues found`,
      suggestion: 'Run accessibility tests and fix ARIA, focus, and semantic issues.'
    });
  }

  return recommendations;
}

/**
 * Export test metrics to JSON for CI/CD pipeline
 */
export function exportMetrics(report: TestQualityReport, filePath?: string): void {
  const output = JSON.stringify(report, null, 2);
  
  if (filePath) {
    // In a real environment, you'd write to file
    console.log(`Would write metrics to ${filePath}`);
    console.log(output.substring(0, 200) + '...');
  }
  
  console.log('📊 Test Quality Report:');
  console.log(`Tests: ${report.metrics.totalTests} (${report.metrics.totalSuites} suites)`);
  console.log(`Coverage: ${Object.values(report.metrics.coverage).map(v => `${v}%`).join(' / ')}`);
  console.log(`Quality Issues: ${report.metrics.quality.warnings + report.metrics.quality.errors}`);
  
  if (report.recommendations.length > 0) {
    console.log('\n🚨 Recommendations:');
    report.recommendations.forEach((rec, index) => {
      const emoji = rec.severity === 'high' ? '🔴' : rec.severity === 'medium' ? '🟡' : '🟢';
      console.log(`${index + 1}. ${emoji} [${rec.category}] ${rec.message}`);
      console.log(`   💡 ${rec.suggestion}`);
    });
  } else {
    console.log('✅ All quality gates passed!');
  }
}

/**
 * Check if test run passes quality gates
 */
export function passesQualityGates(metrics: TestMetrics): boolean {
  const coveragePassed = Object.entries(QUALITY_THRESHOLDS.coverage)
    .every(([key, threshold]) => 
      metrics.coverage[key as keyof typeof metrics.coverage] >= threshold
    );

  const performancePassed = 
    metrics.performance.averageTestTime <= QUALITY_THRESHOLDS.performance.maxTestTime &&
    metrics.performance.slowestTests.length <= QUALITY_THRESHOLDS.performance.maxSlowTests;

  const qualityPassed = 
    metrics.quality.warnings <= QUALITY_THRESHOLDS.quality.maxWarnings &&
    metrics.quality.errors <= QUALITY_THRESHOLDS.quality.maxErrors &&
    metrics.quality.deprecations <= QUALITY_THRESHOLDS.quality.maxDeprecations;

  return coveragePassed && performancePassed && qualityPassed;
}

export default {
  analyzeTestQuality,
  exportMetrics,
  passesQualityGates,
  QUALITY_THRESHOLDS
};