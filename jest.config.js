
module.exports = {
  testEnvironment: 'jest-environment-jsdom',
  // Include legacy static JS unit tests (if any) and new React frontend tests
  testMatch: [
    '**/static/js/__tests__/**/*.test.js',
    '**/frontend/src/__tests__/**/*.test.jsx'
  ],
  moduleFileExtensions: ['js', 'jsx', 'json'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest'
  }
};
