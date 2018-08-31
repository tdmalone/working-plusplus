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

  const slackClientMock = require( pathToMock );
  slack.setSlackClient( slackClientMock );

  // Re-mock the client so we can listen to it.
  slackClientMock.users.list = jest.fn();

  it( 'contacts the Slack API to retrieve the users list on the first try', () => {
    expect.assertions( 2 );

    // Calling this function should return a Promise that then throws, because there's nothing in
    // the mock for it to work with - but we should still be able to spy on it having called the
    // mock!
    const userList = slack.getUserList();
    expect( userList ).toBeInstanceOf( Promise );
    return userList.catch( () => {
      expect( slackClientMock.users.list ).toHaveBeenCalledTimes( 1 );
    });
  });

  it( 'retrieves the user list from memory on subsequent tries', () => {
    expect.assertions( 3 );
    slackClientMock.users.list.mockClear();

    // This should return a Promise with an empty object, because our 'mocked mock' won't actually
    // return any users in the object.
    const userList = slack.getUserList();
    expect( userList ).toBeInstanceOf( Promise );
    return userList.then( ( users ) => {
      expect( slackClientMock.users.list ).not.toHaveBeenCalled();
      expect( users ).toEqual({});
    });
  });

  it( 'returns an object containing user objects indexed by their IDs', () => {
    expect.hasAssertions();

    const slack = require( '../src/slack' );
    const slackClientMock = require( pathToMock );
    slack.setSlackClient( slackClientMock );

    return slack.getUserList().then( ( users ) => {
      const keys = Object.keys( users );
      expect( keys[0]).toBe( users[ keys[0] ].id );
    });
  });

}); // GetUserList.

describe( 'getUserName', () => {

  it( 'returns a user\'s real_name when it is available', async() => {
    const slack = require( '../src/slack' );
    const slackClientMock = require( pathToMock );
    slack.setSlackClient( slackClientMock );
    expect.hasAssertions();
    expect( await slack.getUserName( 'U00000100' ) ).toBe( 'Real Name' );
  });

  it( 'returns a user\'s username if real_name is not available', async() => {
    const slack = require( '../src/slack' );
    const slackClientMock = require( pathToMock );
    slack.setSlackClient( slackClientMock );
    expect.hasAssertions();
    expect( await slack.getUserName( 'U00000200' ) ).toBe( 'username' );
  });

  it( 'returns a user\'s username regardless, if asked to', async() => {
    const slack = require( '../src/slack' );
    const slackClientMock = require( pathToMock );
    slack.setSlackClient( slackClientMock );
    expect.hasAssertions();
    expect( await slack.getUserName( 'U00000100', true ) ).toBe( 'username' );
  });

  it( 'returns a fallback string if a user cannot be found', async() => {
    expect.assertions( 2 );
    const userName = await slack.getUserName( 'UXXXXXXXX' );
    expect( userName ).toBeString();
    expect( userName.length ).toBeGreaterThan( 0 );
  });

}); // GetUserName.

describe( 'sendMessage', () => {

  const payload = {
    text: 'Hello there',
    channel: 'C12345678'
  };

  it( 'sends message text to a channel when provided as two arguments', () => {
    expect.hasAssertions();
    const slackClientMock = require( pathToMock );
    slack.setSlackClient( slackClientMock );

    // Re-mock the client so we can listen to it.
    slackClientMock.chat.postMessage = jest.fn();

    return slack.sendMessage( payload.text, payload.channel ).catch( () => {
      expect( slackClientMock.chat.postMessage ).toHaveBeenCalledWith( payload );
    });
  });

  it( 'sends a message to a channel with a full payload as one argument', () => {
    expect.hasAssertions();
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
    expect.hasAssertions();
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
    expect.hasAssertions();
    const slackClientMock = require( pathToMock );
    slack.setSlackClient( slackClientMock );

    slackClientMock.options.shouldPostMessageSucceed = true;
    return slack.sendMessage( payload.text, payload.channel ).then( ( data ) => {
      expect( data ).toBeNil();
    });
  });

  it( 'returns a Promise and rejects it if the message fails', () => {
    expect.hasAssertions();
    const slackClientMock = require( pathToMock );
    slack.setSlackClient( slackClientMock );

    slackClientMock.options.shouldPostMessageSucceed = false;
    return slack.sendMessage( payload.text, payload.channel ).catch( ( error ) => {
      expect( error ).toBeNil();
    });
  });

}); // SendMessage.
