/**
 * Custom ESLint configuration.
 *
 * @see https://eslint.org/docs/rules/
 */

'use strict';

module.exports = {

  env: {
    browser: false,
    node: true
  },

  extends: [
    'tdmalone' // @see https://github.com/tdmalone/eslint-config-tdmalone/blob/master/index.js
  ],

  parserOptions: {
    ecmaVersion: 9 // Aka ES2018. @see https://node.green/#ES2018
  },

  rules: {

    'array-bracket-newline': [ 'error', 'consistent' ],
    'array-element-newline': [ 'error', 'consistent' ],

    'object-curly-newline': [
      'error',
      {
        minProperties: 3,
        multiline: true,
        consistent: true
      }
    ],

    'key-spacing': [
      'warn',
      {
        beforeColon: false,
        afterColon: true,
        mode: 'strict'
      }
    ],

    'max-statements': [ 'error', { max: 20 } ],

    'no-magic-numbers': [
      'error',
      {
        ignore: [
          -1,
          0,
          1
        ],
        ignoreArrayIndexes: true,
        enforceConst: true
      }
    ],

    'no-multi-str': [ 'off' ],
    'no-var': [ 'error' ],
    'prefer-const': [ 'error' ]

  } // Rules.
}; // Module.exports.
