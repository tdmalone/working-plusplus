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

module.exports = {
  options,
  chat
};
