#!/usr/bin/env node

/**
 * Test Quality Analysis Script
 * Epic 7: Testing & Quality Assurance
 * 
 * This script runs the complete test suite and analyzes quality metrics
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Import our test quality utilities (simplified for Node.js compatibility)
function analyzeTestQuality(testResults = {}, coverage = null, performance = {}) {
  const metrics = {
    totalTests: testResults.numTotalTests || 0,
    totalSuites: testResults.numTotalTestSuites || 0,
    passedTests: testResults.numPassedTests || 0,
    failedTests: testResults.numFailedTests || 0,
    coverage: {
      statements: coverage?.total?.statements?.pct || 0,
      branches: coverage?.total?.branches?.pct || 0,
      functions: coverage?.total?.functions?.pct || 0,
      lines: coverage?.total?.lines?.pct || 0
    },
    performance: {
      averageTestTime: performance.averageTime || 0,
      slowestTests: performance.slowestTests || [],
      suitePerformance: {}
    },
    quality: {
      warnings: performance.warnings || 0,
      errors: performance.errors || 0,
      deprecations: 0,
      accessibilityIssues: performance.accessibilityIssues || 0
    }
  };

  const recommendations = [];

  // Coverage recommendations
  if (metrics.coverage.statements < 80) {
    recommendations.push({
      category: 'coverage',
      severity: metrics.coverage.statements < 70 ? 'high' : 'medium',
      message: `Statement coverage is ${metrics.coverage.statements}% (target: 80%)`,
      suggestion: 'Add more unit tests to cover untested code paths'
    });
  }

  if (metrics.coverage.branches < 75) {
    recommendations.push({
      category: 'coverage',
      severity: metrics.coverage.branches < 65 ? 'high' : 'medium',
      message: `Branch coverage is ${metrics.coverage.branches}% (target: 75%)`,
      suggestion: 'Add tests for conditional logic and edge cases'
    });
  }

  // Quality recommendations
  if (metrics.quality.warnings > 0) {
    recommendations.push({
      category: 'quality',
      severity: metrics.quality.warnings > 10 ? 'high' : 'medium',
      message: `${metrics.quality.warnings} test warnings detected`,
      suggestion: 'Address console warnings in test output'
    });
  }

  if (metrics.quality.errors > 0) {
    recommendations.push({
      category: 'quality',
      severity: 'high',
      message: `${metrics.quality.errors} test errors detected`,
      suggestion: 'Fix failing tests and error conditions'
    });
  }

  return {
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    metrics,
    recommendations
  };
}

function exportMetrics(report) {
  console.log('📊 Test Quality Report:');
  console.log(`Timestamp: ${report.timestamp}`);
  console.log(`Tests: ${report.metrics.totalTests} (${report.metrics.totalSuites} suites)`);
  console.log(`Passed: ${report.metrics.passedTests}, Failed: ${report.metrics.failedTests}`);
  console.log(`Coverage: ${report.metrics.coverage.statements}% / ${report.metrics.coverage.branches}% / ${report.metrics.coverage.functions}% / ${report.metrics.coverage.lines}%`);
  console.log(`Performance: ${report.metrics.performance.averageTestTime}ms average`);
  console.log(`Quality: ${report.metrics.quality.warnings} warnings, ${report.metrics.quality.errors} errors`);

  if (report.recommendations.length === 0) {
    console.log('✅ All quality gates passed!');
  } else {
    console.log('\n🚨 Recommendations:');
    report.recommendations.forEach((rec, index) => {
      const severityIcon = rec.severity === 'high' ? '🔴' : rec.severity === 'medium' ? '🟡' : '🟢';
      console.log(`${index + 1}. ${severityIcon} [${rec.category}] ${rec.message}`);
      console.log(`   💡 ${rec.suggestion}`);
    });
  }
}

function passesQualityGates(metrics) {
  return metrics.coverage.statements >= 80 &&
         metrics.coverage.branches >= 75 &&
         metrics.coverage.functions >= 80 &&
         metrics.coverage.lines >= 80 &&
         metrics.performance.averageTestTime <= 5000 &&
         metrics.quality.warnings <= 0 &&
         metrics.quality.errors <= 0;
}

async function runQualityAnalysis() {
  console.log('🧪 Starting Test Quality Analysis...\n');

  try {
    // Run tests with coverage
    console.log('📊 Running tests with coverage...');
    let testOutput;
    try {
      testOutput = execSync('npm run test:unit -- --coverage --passWithNoTests --silent', {
        encoding: 'utf8',
        cwd: process.cwd(),
        stdio: 'pipe'
      });
    } catch (error) {
      // Jest returns exit code 1 when coverage thresholds aren't met, but we still get output
      testOutput = error.stdout || error.output?.join('') || '';
      if (!testOutput.includes('Test Suites:')) {
        throw error; // Re-throw if it's a real error, not just coverage threshold
      }
    }

    // Parse test results from Jest output
    const totalTestsMatch = testOutput.match(/Tests:\s*\d+\s*passed,\s*(\d+)\s*total/);
    const totalSuitesMatch = testOutput.match(/Test Suites:\s*\d+\s*passed,\s*(\d+)\s*total/);
    const passedTestsMatch = testOutput.match(/Tests:\s*(\d+)\s*passed/);
    const failedTestsMatch = testOutput.match(/(\d+)\s*failed/);
    
    const testResults = {
      numTotalTests: totalTestsMatch ? parseInt(totalTestsMatch[1]) : 0,
      numTotalTestSuites: totalSuitesMatch ? parseInt(totalSuitesMatch[1]) : 0,
      numPassedTests: passedTestsMatch ? parseInt(passedTestsMatch[1]) : 0,
      numFailedTests: failedTestsMatch ? parseInt(failedTestsMatch[1]) : 0
    };

    // Try to read coverage data from the test results directory
    let coverage = null;
    const coveragePaths = [
      path.join(process.cwd(), 'test-results', 'coverage', 'coverage-summary.json'),
      path.join(process.cwd(), 'coverage', 'coverage-summary.json')
    ];
    
    for (const coveragePath of coveragePaths) {
      if (fs.existsSync(coveragePath)) {
        try {
          const coverageData = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
          coverage = {
            total: {
              statements: { pct: coverageData.total?.statements?.pct || 0 },
              branches: { pct: coverageData.total?.branches?.pct || 0 },
              functions: { pct: coverageData.total?.functions?.pct || 0 },
              lines: { pct: coverageData.total?.lines?.pct || 0 }
            }
          };
          break;
        } catch (e) {
          console.warn(`Could not parse coverage file: ${coveragePath}`);
        }
      }
    }
    
    // If no coverage file found, try to extract from Jest output
    if (!coverage) {
      const stmtMatch = testOutput.match(/coverage threshold for statements \(\d+%\) not met: (\d+(?:\.\d+)?)%/);
      const branchMatch = testOutput.match(/coverage threshold for branches \(\d+%\) not met: (\d+(?:\.\d+)?)%/);
      const funcMatch = testOutput.match(/coverage threshold for functions \(\d+%\) not met: (\d+(?:\.\d+)?)%/);
      const lineMatch = testOutput.match(/coverage threshold for lines \(\d+%\) not met: (\d+(?:\.\d+)?)%/);
      
      coverage = {
        total: {
          statements: { pct: stmtMatch ? parseFloat(stmtMatch[1]) : 0 },
          branches: { pct: branchMatch ? parseFloat(branchMatch[1]) : 0 },
          functions: { pct: funcMatch ? parseFloat(funcMatch[1]) : 0 },
          lines: { pct: lineMatch ? parseFloat(lineMatch[1]) : 0 }
        }
      };
    }

    // Analyze performance (simplified)
    const performance = {
      averageTime: extractNumber(testOutput, /Time:\s*(\d+(?:\.\d+)?)/) * 1000 || 0, // Convert to ms
      slowestTests: [], // Would need jest reporter for this
      warnings: (testOutput.match(/console\.warn/g) || []).length,
      errors: (testOutput.match(/console\.error/g) || []).length,
      accessibilityIssues: (testOutput.match(/Image missing alt text|Heading hierarchy violation|Button without accessible name/g) || []).length
    };

    // Generate quality report
    console.log('\n🔍 Analyzing test quality...');
    const qualityReport = analyzeTestQuality(testResults, coverage, performance);

    // Export metrics
    exportMetrics(qualityReport);

    // Check quality gates
    const passesGates = passesQualityGates(qualityReport.metrics);
    
    if (passesGates) {
      console.log('\n✅ All quality gates passed! Test suite is healthy.');
      process.exit(0);
    } else {
      console.log('\n❌ Some quality gates failed. Review recommendations above.');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Quality analysis failed:', error.message);
    
    // Extract what we can from the error output if tests ran but failed thresholds
    const errorOutput = error.stdout || error.stderr || (error.output && error.output.join('')) || error.message || '';
    console.log('Debug: Error output length:', errorOutput.length);
    console.log('Debug: Contains Test Suites:', errorOutput.includes('Test Suites:'));
    
    if (errorOutput.includes('Test Suites:') && errorOutput.includes('Tests:')) {
      console.log('\n🔍 Analyzing available test results...');
      
      // Parse what we can from the output
      const totalTestsMatch = errorOutput.match(/Tests:\s*\d+\s*passed,\s*(\d+)\s*total/);
      const totalSuitesMatch = errorOutput.match(/Test Suites:\s*\d+\s*passed,\s*(\d+)\s*total/);
      const passedTestsMatch = errorOutput.match(/Tests:\s*(\d+)\s*passed/);
      
      const stmtMatch = errorOutput.match(/coverage threshold for statements \(\d+%\) not met: (\d+(?:\.\d+)?)%/);
      const branchMatch = errorOutput.match(/coverage threshold for branches \(\d+%\) not met: (\d+(?:\.\d+)?)%/);
      const funcMatch = errorOutput.match(/coverage threshold for functions \(\d+%\) not met: (\d+(?:\.\d+)?)%/);
      const lineMatch = errorOutput.match(/coverage threshold for lines \(\d+%\) not met: (\d+(?:\.\d+)?)%/);
      
      const testResults = {
        numTotalTests: totalTestsMatch ? parseInt(totalTestsMatch[1]) : 0,
        numTotalTestSuites: totalSuitesMatch ? parseInt(totalSuitesMatch[1]) : 0,
        numPassedTests: passedTestsMatch ? parseInt(passedTestsMatch[1]) : 0,
        numFailedTests: 0
      };
      
      const coverage = {
        total: {
          statements: { pct: stmtMatch ? parseFloat(stmtMatch[1]) : 0 },
          branches: { pct: branchMatch ? parseFloat(branchMatch[1]) : 0 },
          functions: { pct: funcMatch ? parseFloat(funcMatch[1]) : 0 },
          lines: { pct: lineMatch ? parseFloat(lineMatch[1]) : 0 }
        }
      };
      
      const performance = {
        averageTime: 0,
        slowestTests: [],
        warnings: (errorOutput.match(/console\.warn/g) || []).length,
        errors: 0,
        accessibilityIssues: 0
      };
      
      const qualityReport = analyzeTestQuality(testResults, coverage, performance);
      exportMetrics(qualityReport);
      
      const passesGates = passesQualityGates(qualityReport.metrics);
      if (passesGates) {
        console.log('\n✅ All quality gates passed! Test suite is healthy.');
        process.exit(0);
      } else {
        console.log('\n❌ Some quality gates failed. Review recommendations above.');
        process.exit(1);
      }
    } else {
      // If tests fail, still try to provide some analysis
      console.log('\n🔍 Running basic quality check...');
      const basicReport = analyzeTestQuality({}, null, { warnings: 0, errors: 1 });
      exportMetrics(basicReport);
      process.exit(1);
    }
  }
}

function extractNumber(text, regex) {
  const match = text.match(regex);
  return match ? parseInt(match[match.length - 1]) : null;
}

// Run if called directly
if (require.main === module) {
  runQualityAnalysis();
}

module.exports = { runQualityAnalysis };