/**
 * A simple mock of the parts of the Slack Web API that we use.
 *
 * @author Tim Malone <tdmalone@gmail.com>
 */

'use strict';

/* eslint-disable no-empty-function */

const options = {
  shouldPostMessageSucceed: true
};

const chat = {
  postMessage: ( payload ) => { // eslint-disable-line no-unused-vars
    return new Promise( ( resolve ) => {
      resolve({ ok: options.shouldPostMessageSucceed });
    });
  }
};

const users = {
  list: () => {
    return new Promise( ( resolve ) => {
      resolve({
        ok: true,
        members: [
          {
            id: 'U00000100'
          },
          {
            id: 'U00000200'
          },
          {
            id: 'U00000300'
          }
        ]
      });
    });
  }
};

module.exports = {
  options,
  chat,
  users
};
