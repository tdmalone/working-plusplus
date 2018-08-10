
'use strict';

module.exports = {
  overrides: [
    {
      files: [ '*.js' ],
      rules: {
        'no-loop-func': 'off',
        'max-nested-callbacks': [ 'error', { max: 5 } ]
      }
    }
  ]
};
