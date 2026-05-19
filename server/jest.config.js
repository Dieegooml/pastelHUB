module.exports = {
  testEnvironment: 'node',
  setupFiles: ['./tests/setup.js'],
  testMatch: ['**/tests/**/*.test.js'],
  verbose: true,
  forceExit: true,
  clearMocks: true,
  reporters: [
    'default',
    ['./node_modules/jest-html-reporter', {
      pageTitle: 'PastelHub - Resultados de Tests',
      outputPath: './test-report.html',
      includeFailureMsg: true,
      includeSuiteFailure: true,
      theme: 'defaultTheme',
    }],
  ],
};