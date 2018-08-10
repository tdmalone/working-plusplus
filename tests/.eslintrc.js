
'use strict';

module.exports = {
  overrides: [
    {
      files: [ '*.js' ],
      rules: {
        'no-loop-func': 'off',
        'no-magic-numbers': 'off',
        'no-process-env': 'off',
        'max-nested-callbacks': [ 'error', { max: 5 } ]
      }
    }
  ]
};
