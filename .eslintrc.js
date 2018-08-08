
'use strict';

module.exports = {

  env: {
    browser: false,
    node:    true
  },

  extends: [ 'tdmalone' ],

  parserOptions: {
    ecmaVersion: 8
  },

  rules: {
    'max-statements':   [ 'error', { max: 75 } ],
    'no-magic-numbers': [ 'error', {
      ignore: [
        -1,
        0,
        1
      ],
      ignoreArrayIndexes: true,
      enforceConst:       true
    } ],
    'no-multi-str': [ 'off' ]
  }

};
