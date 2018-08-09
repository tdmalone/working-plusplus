
'use strict';

module.exports = {

  env: {
    browser: false,
    node:    true
  },

  extends: [ 'tdmalone' ],

  parserOptions: {
    ecmaVersion: 9 // Aka ES2018. @see https://node.green/#ES2018
  },

  rules: {

    'max-nested-callbacks': [ 'error', { max: 4 } ],
    'max-statements':       [ 'error', { max: 75 } ],

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
