import { 
  analyzeTestQuality, 
  exportMetrics, 
  passesQualityGates, 
  QUALITY_THRESHOLDS,
  TestMetrics 
} from './testQuality';

// Mock console methods
const mockConsoleLog = jest.fn();
const originalConsoleLog = console.log;

beforeAll(() => {
  console.log = mockConsoleLog;
});

afterAll(() => {
  console.log = originalConsoleLog;
});

describe('Test Quality Utilities', () => {
  beforeEach(() => {
    mockConsoleLog.mockClear();
  });

  describe('analyzeTestQuality', () => {
    it('generates quality report with basic metrics', () => {
      const testResults = {
        numTotalTests: 686,
        numTotalTestSuites: 38
      };

      const coverage = {
        total: {
          statements: { pct: 85 },
          branches: { pct: 78 },
          functions: { pct: 82 },
          lines: { pct: 84 }
        }
      };

      const performance = {
        averageTime: 1500,
        slowestTests: [
          { name: 'slow test 1', duration: 3000 },
          { name: 'slow test 2', duration: 2500 }
        ],
        warnings: 5,
        errors: 0
      };

      const report = analyzeTestQuality(testResults, coverage, performance);

      expect(report.metrics.totalTests).toBe(686);
      expect(report.metrics.totalSuites).toBe(38);
      expect(report.metrics.coverage.statements).toBe(85);
      expect(report.recommendations).toHaveLength(1); // Should have warning recommendation
    });

    it('handles missing data gracefully', () => {
      const testResults = {};
      const report = analyzeTestQuality(testResults);

      expect(report.metrics.totalTests).toBe(0);
      expect(report.metrics.coverage.statements).toBe(0);
      expect(report.recommendations.length).toBeGreaterThan(0); // Should recommend improvements
    });

    it('generates coverage recommendations for low coverage', () => {
      const testResults = { numTotalTests: 100 };
      const coverage = {
        total: {
          statements: { pct: 60 }, // Below 80% threshold
          branches: { pct: 50 },   // Below 75% threshold
          functions: { pct: 70 },  // Below 80% threshold
          lines: { pct: 65 }       // Below 80% threshold
        }
      };

      const report = analyzeTestQuality(testResults, coverage);
      const coverageRecs = report.recommendations.filter((r: any) => r.category === 'coverage');

      expect(coverageRecs).toHaveLength(4); // All coverage types below threshold
      expect(coverageRecs.length).toBeGreaterThan(0); // Should have coverage recommendations
    });

    it('generates performance recommendations for slow tests', () => {
      const testResults = { numTotalTests: 100 };
      const performance = {
        averageTime: 6000, // Above 5000ms threshold
        slowestTests: new Array(15).fill({ name: 'slow test', duration: 4000 }) // Above 10 threshold
      };

      const report = analyzeTestQuality(testResults, undefined, performance);
      const perfRecs = report.recommendations.filter((r: any) => r.category === 'performance');

      expect(perfRecs).toHaveLength(2); // Average time and slow tests count
    });

    it('generates quality recommendations for warnings and errors', () => {
      const testResults = { numTotalTests: 100 };
      const performance = {
        warnings: 10, // Above 0 threshold
        errors: 2,    // Above 0 threshold
        accessibilityIssues: 3
      };

      const report = analyzeTestQuality(testResults, undefined, performance);
      const qualityRecs = report.recommendations.filter((r: any) => 
        r.category === 'quality' || r.category === 'accessibility'
      );

      expect(qualityRecs).toHaveLength(3); // Warnings, errors, and accessibility issues
    });
  });

  describe('exportMetrics', () => {
    it('logs test metrics to console', () => {
      const mockReport = {
        timestamp: '2024-01-01T00:00:00.000Z',
        version: '1.0.0',
        metrics: {
          totalTests: 686,
          totalSuites: 38,
          coverage: {
            statements: 85,
            branches: 78,
            functions: 82,
            lines: 84
          },
          performance: {
            averageTestTime: 1500,
            slowestTests: [],
            suitePerformance: {}
          },
          quality: {
            warnings: 0,
            errors: 0,
            deprecations: 0,
            accessibilityIssues: 0
          }
        },
        recommendations: []
      };

      exportMetrics(mockReport);

      expect(mockConsoleLog).toHaveBeenCalledWith('📊 Test Quality Report:');
      expect(mockConsoleLog).toHaveBeenCalledWith('Tests: 686 (38 suites)');
      expect(mockConsoleLog).toHaveBeenCalledWith('Coverage: 85% / 78% / 82% / 84%');
      expect(mockConsoleLog).toHaveBeenCalledWith('✅ All quality gates passed!');
    });

    it('displays recommendations when present', () => {
      const mockReport = {
        timestamp: '2024-01-01T00:00:00.000Z',
        version: '1.0.0',
        metrics: {
          totalTests: 686,
          totalSuites: 38,
          coverage: { statements: 85, branches: 78, functions: 82, lines: 84 },
          performance: { averageTestTime: 1500, slowestTests: [], suitePerformance: {} },
          quality: { warnings: 5, errors: 0, deprecations: 0, accessibilityIssues: 0 }
        },
        recommendations: [
          {
            category: 'quality' as const,
            severity: 'medium' as const,
            message: '5 test warnings detected',
            suggestion: 'Address console warnings'
          }
        ]
      };

      exportMetrics(mockReport);

      expect(mockConsoleLog).toHaveBeenCalledWith('\n🚨 Recommendations:');
      expect(mockConsoleLog).toHaveBeenCalledWith('1. 🟡 [quality] 5 test warnings detected');
      expect(mockConsoleLog).toHaveBeenCalledWith('   💡 Address console warnings');
    });

    it('writes to file when filePath is provided', () => {
      const mockReport = {
        timestamp: '2024-01-01T00:00:00.000Z',
        version: '1.0.0',
        metrics: {
          totalTests: 686,
          totalSuites: 38,
          coverage: { statements: 85, branches: 78, functions: 82, lines: 84 },
          performance: { averageTestTime: 1500, slowestTests: [], suitePerformance: {} },
          quality: { warnings: 0, errors: 0, deprecations: 0, accessibilityIssues: 0 }
        },
        recommendations: []
      };

      exportMetrics(mockReport, '/path/to/metrics.json');

      expect(mockConsoleLog).toHaveBeenCalledWith('Would write metrics to /path/to/metrics.json');
    });
  });

  describe('passesQualityGates', () => {
    it('passes when all metrics meet thresholds', () => {
      const metrics: TestMetrics = {
        totalTests: 686,
        totalSuites: 38,
        coverage: {
          statements: 85, // >= 80
          branches: 78,   // >= 75
          functions: 82,  // >= 80
          lines: 84       // >= 80
        },
        performance: {
          averageTestTime: 3000, // <= 5000
          slowestTests: [{ name: 'test1', duration: 4000 }], // <= 10
          suitePerformance: {}
        },
        quality: {
          warnings: 0,    // <= 0
          errors: 0,      // <= 0
          deprecations: 0, // <= 0
          accessibilityIssues: 2 // Not checked in quality gates
        }
      };

      expect(passesQualityGates(metrics)).toBe(true);
    });

    it('fails when coverage is below threshold', () => {
      const metrics: TestMetrics = {
        totalTests: 686,
        totalSuites: 38,
        coverage: {
          statements: 70, // < 80
          branches: 78,
          functions: 82,
          lines: 84
        },
        performance: {
          averageTestTime: 3000,
          slowestTests: [],
          suitePerformance: {}
        },
        quality: {
          warnings: 0,
          errors: 0,
          deprecations: 0,
          accessibilityIssues: 0
        }
      };

      expect(passesQualityGates(metrics)).toBe(false);
    });

    it('fails when performance is below threshold', () => {
      const metrics: TestMetrics = {
        totalTests: 686,
        totalSuites: 38,
        coverage: {
          statements: 85,
          branches: 78,
          functions: 82,
          lines: 84
        },
        performance: {
          averageTestTime: 6000, // > 5000
          slowestTests: [],
          suitePerformance: {}
        },
        quality: {
          warnings: 0,
          errors: 0,
          deprecations: 0,
          accessibilityIssues: 0
        }
      };

      expect(passesQualityGates(metrics)).toBe(false);
    });

    it('fails when quality issues exceed threshold', () => {
      const metrics: TestMetrics = {
        totalTests: 686,
        totalSuites: 38,
        coverage: {
          statements: 85,
          branches: 78,
          functions: 82,
          lines: 84
        },
        performance: {
          averageTestTime: 3000,
          slowestTests: [],
          suitePerformance: {}
        },
        quality: {
          warnings: 5, // > 0
          errors: 0,
          deprecations: 0,
          accessibilityIssues: 0
        }
      };

      expect(passesQualityGates(metrics)).toBe(false);
    });
  });

  describe('QUALITY_THRESHOLDS', () => {
    it('has expected threshold values', () => {
      expect(QUALITY_THRESHOLDS.coverage.statements).toBe(80);
      expect(QUALITY_THRESHOLDS.coverage.branches).toBe(75);
      expect(QUALITY_THRESHOLDS.coverage.functions).toBe(80);
      expect(QUALITY_THRESHOLDS.coverage.lines).toBe(80);

      expect(QUALITY_THRESHOLDS.performance.maxTestTime).toBe(5000);
      expect(QUALITY_THRESHOLDS.performance.maxSuiteTime).toBe(30000);
      expect(QUALITY_THRESHOLDS.performance.maxSlowTests).toBe(10);

      expect(QUALITY_THRESHOLDS.quality.maxWarnings).toBe(0);
      expect(QUALITY_THRESHOLDS.quality.maxErrors).toBe(0);
      expect(QUALITY_THRESHOLDS.quality.maxDeprecations).toBe(0);
    });
  });
});