/**
 * A simple mock of the parts of the Slack Web API that we use.
 *
 * @author Tim Malone <tdmalone@gmail.com>
 */

'use strict';

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

        /* eslint-disable camelcase */
        members: [
          {
            id: 'U00000100',
            name: 'username',
            profile: {
              real_name: 'Real Name'
            }
          },
          { // This user must not have a real_name; see getUserName tests.
            id: 'U00000200',

            name: 'username',
            profile: {} // This user must not have a real_name; see getUserName tests.
          },
          {
            id: 'U00000300'
          }
        ]
        /* eslint-enable camelcase */

      });
    });

  } // List.
}; // Users.

module.exports = {
  options,
  chat,
  users
};
