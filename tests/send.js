/**
 * Unit tests on the code in send.js.
 *
 * @see https://jestjs.io/docs/en/expect
 * @see https://github.com/jest-community/jest-extended#api
 * @author Tim Malone <tdmalone@gmail.com>
 */

/* global jest */

'use strict';

const send = require( '../src/send' );
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
    expect( send.setSlackClient ).toHaveLength( 1 );
  });

});

describe( 'sendMessage', () => {

  const payload = {
    text: 'Hello there',
    channel: 'C12345678'
  };

  it( 'sends message text to a channel when provided as two arguments', () => {
    expect.assertions( 1 );
    const slackClientMock = require( pathToMock );
    send.setSlackClient( slackClientMock );

    // Re-mock the client so we can listen to it.
    slackClientMock.chat.postMessage = jest.fn();

    return send.sendMessage( payload.text, payload.channel ).catch( () => {
      expect( slackClientMock.chat.postMessage ).toHaveBeenCalledWith( payload );
    });
  });

  it( 'sends a message to a channel with a full payload as one argument', () => {
    expect.assertions( 1 );
    const slackClientMock = require( pathToMock );
    send.setSlackClient( slackClientMock );

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

    return send.sendMessage( payload ).catch( () => {
      expect( slackClientMock.chat.postMessage ).toHaveBeenCalledWith( payload );
    });
  });

  it( 'sends a message to a channel when payload and channel are passed separately', () => {
    expect.assertions( 1 );
    const slackClientMock = require( pathToMock );
    send.setSlackClient( slackClientMock );

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

    return send.sendMessage( payload, channel ).catch( () => {
      payload.channel = channel;
      expect( slackClientMock.chat.postMessage ).toHaveBeenCalledWith( payload );
    });
  });

  it( 'returns a Promise and resolves it if the message succeeds', () => {
    expect.assertions( 1 );
    const slackClientMock = require( pathToMock );
    send.setSlackClient( slackClientMock );

    slackClientMock.options.shouldPostMessageSucceed = true;
    return send.sendMessage( payload.text, payload.channel ).then( ( data ) => {
      expect( data ).toBeNil();
    });
  });

  it( 'returns a Promise and rejects it if the message fails', () => {
    expect.assertions( 1 );
    const slackClientMock = require( pathToMock );
    send.setSlackClient( slackClientMock );

    slackClientMock.options.shouldPostMessageSucceed = false;
    return send.sendMessage( payload.text, payload.channel ).catch( ( error ) => {
      expect( error ).toBeNil();
    });
  });

});
