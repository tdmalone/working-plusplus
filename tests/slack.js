/**
 * Unit tests on the code in send.js.
 *
 * @see https://jestjs.io/docs/en/expect
 * @see https://github.com/jest-community/jest-extended#api
 * @author Tim Malone <tdmalone@gmail.com>
 */

/* global jest */

'use strict';

const slack = require( '../src/slack' );
const pathToMock = './mocks/slack';

// Catch all console output during tests.
console.error = jest.fn();
console.info = jest.fn();
console.log = jest.fn();
console.warn = jest.fn();

// Clear module cache due to us sometimes messing with the mock.
beforeEach( () => {
  jest.resetModules();
});

describe( 'setSlackClient', () => {

  it( 'accepts a single parameter (that is later used as the Slack API client)', () => {
    expect( slack.setSlackClient ).toHaveLength( 1 );
  });

});

describe( 'getUserList', () => {

  it( 'contacts the Slack API to retrieve the users list on the first try', () => {

  });

  it( 'retrieves the user list from memory on subsequent tries', () => {

  });

  it( 'returns an object containing user objects indexed by their IDs', () => {

  });

}); // GetUserList.

describe( 'getUserName', () => {

  it( 'returns a user\'s real_name when it is available', () => {

  });

  it( 'returns a user\'s name if real_name is not available', () => {

  });

  it( 'returns a fallback string if a user cannot be found', () => {

  });

}); // GetUserName.

describe( 'sendMessage', () => {

  const payload = {
    text: 'Hello there',
    channel: 'C12345678'
  };

  it( 'sends message text to a channel when provided as two arguments', () => {
    expect.assertions( 1 );
    const slackClientMock = require( pathToMock );
    slack.setSlackClient( slackClientMock );

    // Re-mock the client so we can listen to it.
    slackClientMock.chat.postMessage = jest.fn();

    return slack.sendMessage( payload.text, payload.channel ).catch( () => {
      expect( slackClientMock.chat.postMessage ).toHaveBeenCalledWith( payload );
    });
  });

  it( 'sends a message to a channel with a full payload as one argument', () => {
    expect.assertions( 1 );
    const slackClientMock = require( pathToMock );
    slack.setSlackClient( slackClientMock );

    // Re-mock the client so we can listen to it.
    slackClientMock.chat.postMessage = jest.fn();

    const payload = {
      text: 'Hello there',
      channel: 'C12345678',
      attachments: [
        {
          'text': 'Attachment text'
        }
      ]
    };

    return slack.sendMessage( payload ).catch( () => {
      expect( slackClientMock.chat.postMessage ).toHaveBeenCalledWith( payload );
    });
  });

  it( 'sends a message to a channel when payload and channel are passed separately', () => {
    expect.assertions( 1 );
    const slackClientMock = require( pathToMock );
    slack.setSlackClient( slackClientMock );

    // Re-mock the client so we can listen to it.
    slackClientMock.chat.postMessage = jest.fn();

    const channel = 'C12345678';
    const payload = {
      text: 'Hello there',
      attachments: [
        {
          'text': 'Attachment text'
        }
      ]
    };

    return slack.sendMessage( payload, channel ).catch( () => {
      payload.channel = channel;
      expect( slackClientMock.chat.postMessage ).toHaveBeenCalledWith( payload );
    });
  });

  it( 'returns a Promise and resolves it if the message succeeds', () => {
    expect.assertions( 1 );
    const slackClientMock = require( pathToMock );
    slack.setSlackClient( slackClientMock );

    slackClientMock.options.shouldPostMessageSucceed = true;
    return slack.sendMessage( payload.text, payload.channel ).then( ( data ) => {
      expect( data ).toBeNil();
    });
  });

  it( 'returns a Promise and rejects it if the message fails', () => {
    expect.assertions( 1 );
    const slackClientMock = require( pathToMock );
    slack.setSlackClient( slackClientMock );

    slackClientMock.options.shouldPostMessageSucceed = false;
    return slack.sendMessage( payload.text, payload.channel ).catch( ( error ) => {
      expect( error ).toBeNil();
    });
  });

}); // SendMessage.
