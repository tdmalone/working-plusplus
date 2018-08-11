/**
 * A simple mock of an HTTP request and response in Express.
 * You will usually want to add things to this in individual tests.
 */

'use strict';

module.exports = {

  request: {
    ip: '123.45.67.89',
    method: 'POST',
    path: '/some-path',

    body: {
      token: process.env.SLACK_VERIFICATION_TOKEN // eslint-disable-line no-process-env
    },

    headers: {
      'user-agent': 'Some Bot 1.0'
    }
  },

  response: {
    send: () => {} // eslint-disable-line no-empty-function
  }
};
