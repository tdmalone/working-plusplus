/**
 * Unit tests on the code in send.js.
 *
 * @see https://jestjs.io/docs/en/expect
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

  it( 'sends the provided message text to the provided channel via the Slack Web API', () => {
    expect.assertions( 1 );
    const slackClientMock = require( pathToMock );
    send.setSlackClient( slackClientMock );

    // Re-mock the client so we can listen to it.
    slackClientMock.chat.postMessage = jest.fn();

    send.sendMessage( payload.text, payload.channel ).catch( () => {
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
