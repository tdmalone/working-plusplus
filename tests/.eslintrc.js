/**
 * Tests are a little different... so we need to override some rules from the main project.
 *
 * @see https://eslint.org/docs/rules/
 */

'use strict';

module.exports = {
  rules: {
    'jest/expect-expect': [ 'error' ],
    'jest/valid-expect-in-promise': [ 'error' ],
    'no-empty-function': 'off',
    'no-loop-func': 'off',
    'no-magic-numbers': 'off',
    'no-process-env': 'off',
    'max-nested-callbacks': [ 'error', { max: 5 } ],
    'max-params': [ 'error', { max: 5 } ]
  }
};
