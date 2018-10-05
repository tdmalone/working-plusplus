/**
 * Custom ESLint configuration.
 *
 * @see https://eslint.org/docs/user-guide/configuring
 * @see https://eslint.org/docs/rules/
 */

'use strict';

module.exports = {
  extends: [ 'tdmalone' ], // @see https://github.com/tdmalone/eslint-config-tdmalone
  rules: {
    'max-statements': [ 'error', { max: 20 } ]
  }
};
