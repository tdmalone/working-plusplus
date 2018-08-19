/**
 * Configuration for Jest.
 *
 * @see https://jestjs.io/docs/en/configuration.html
 */

'use strict';

const config = {
  collectCoverage: true,
  setupTestFrameworkScriptFile: './jest.plugins',
  testEnvironment: 'node',

  testMatch: [
    '**/tests/**/*.js'
  ],

  testPathIgnorePatterns: [
    '/mocks/',
    '/node_modules/',
    '/_config.js',
    '/_runner.js',
    '/.eslintrc.js'
  ],

  verbose: true
};

/* eslint-disable no-process-env */

if ( process.env.SKIP_INTEGRATION_TESTS ) {
  config.testPathIgnorePatterns.push( 'integration-tests' );
}

if ( process.env.SKIP_E2E_TESTS ) {
  config.testPathIgnorePatterns.push( 'e2e-tests' );
}

process.env.PORT = 5000;
process.env.SLACK_VERIFICATION_TOKEN = 'abcdef123';
process.env.DATABASE_URL = 'postgres://postgres@localhost:5432/plusplus_tests';
process.env.DATABASE_USE_SSL = false;

/* eslint-enable no-process-env */

module.exports = config;
