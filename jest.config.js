
module.exports = {
  // Test environment
  testEnvironment: 'jest-environment-jsdom',
  
  // Test file patterns - updated for TypeScript
  testMatch: [
    '**/static/js/__tests__/**/*.test.js',
    '**/frontend/src/__tests__/**/*.test.{js,jsx,ts,tsx}',
    '**/frontend/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '**/frontend/src/**/*.test.{js,jsx,ts,tsx}'
  ],
  
  // File extensions
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json'],
  
  // Setup files - updated for TypeScript
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  
  // Transform configuration
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest',
    '^.+\\.scss$': 'jest-transform-stub',
    '^.+\\.css$': 'jest-transform-stub'
  },
  
  // Transform ignore patterns to handle ES modules in node_modules
  transformIgnorePatterns: [
    'node_modules/(?!(msw|@bundled-es-modules)/)'
  ],
  
  // Module name mapping for aliases (TypeScript compatible)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/frontend/src/$1',
    '^@components/(.*)$': '<rootDir>/frontend/src/components/$1',
    '^@pages/(.*)$': '<rootDir>/frontend/src/pages/$1',
    '^@services/(.*)$': '<rootDir>/frontend/src/services/$1',
    '^@utils/(.*)$': '<rootDir>/frontend/src/utils/$1',
    '^@styles/(.*)$': '<rootDir>/frontend/src/styles/$1',
    '^@types/(.*)$': '<rootDir>/frontend/src/types/$1',
    '^@context/(.*)$': '<rootDir>/frontend/src/context/$1',
    '^@hooks/(.*)$': '<rootDir>/frontend/src/hooks/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  
  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    'frontend/src/**/*.{js,jsx}',
    '!frontend/src/main.jsx',
    '!frontend/src/**/*.stories.{js,jsx}',
    '!frontend/src/**/*.test.{js,jsx}',
    '!frontend/src/**/__tests__/**',
    '!frontend/src/**/node_modules/**',
    '!**/vendor/**'
  ],
  
  // Coverage thresholds (90% minimum as per requirements)
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },
  
  // Coverage reporters
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'clover'
  ],
  
  // Coverage directory
  coverageDirectory: '<rootDir>/test-results/coverage',
  
  // Test result processors
  reporters: [
    'default',
    ['jest-html-reporters', {
      publicPath: './test-results/html-report',
      filename: 'report.html',
      expand: true
    }]
  ],
  
  // Clear mocks
  clearMocks: true,
  restoreMocks: true,
  
  // Verbose output
  verbose: true,
  
  // Timeout
  testTimeout: 10000
};
