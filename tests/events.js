/**
 * Unit tests on the event handlers in events.js.
 *
 * @see https://jestjs.io/docs/en/expect
 * @see https://github.com/jest-community/jest-extended#api
 * @author Tim Malone <tdmalone@gmail.com>
 */

/* global jest */

'use strict';

const events = require( '../src/events' );
const handlers = events.handlers;

const send = require( '../src/send' ),
      points = require( '../src/points' ),
      messages = require( '../src/messages' );

const slackClientMock = require( './mocks/slack' );
send.setSlackClient( slackClientMock );

send.sendMessage = jest.fn();
points.updateScore = jest.fn();
messages.getRandomMessage = jest.fn();

// Catch all console output during tests.
console.error = jest.fn();
console.info = jest.fn();
console.log = jest.fn();
console.warn = jest.fn();

// Clear module cache + mock counts due to us sometimes messing with mocks.
beforeEach( () => {
  jest.resetModules();
  messages.getRandomMessage.mockClear();
  send.sendMessage.mockClear();
});

describe( 'handleSelfPlus', () => {

  const user = 'U12345678',
        channel = 'C12345678';

  it( 'logs an attempt by a user to increment their own score', () => {
    events.handleSelfPlus( user, channel );
    expect( console.log ).toHaveBeenCalledTimes( 1 );
  });

  it( 'gets a message from the \'self plus\' collection', () => {
    events.handleSelfPlus( user, channel );

    expect( messages.getRandomMessage )
      .toHaveBeenCalledTimes( 1 )
      .toHaveBeenCalledWith( 'selfPlus', user );
  });

  it( 'sends a message back to the user and channel that called it', () => {
    const send = require( '../src/send' ),
          events = require( '../src/events' );

    send.sendMessage = jest.fn();
    send.setSlackClient( slackClientMock );

    events.handleSelfPlus( user, channel );

    expect( send.sendMessage )
      .toHaveBeenCalledTimes( 1 )
      .toHaveBeenCalledWith( expect.stringContaining( user ), channel );
  });

});

describe( 'handlePlusMinus', () => {

  const item = 'SomeRandomThing',
        channel = 'C12345678',
        score = 5;

  /** @returns {integer} Returns a fake score. */
  const updateScoreMock = () => {
    return score;
  };

  it( 'calls the score updater to update an item\'s score', () => {
    const send = require( '../src/send' ),
          points = require( '../src/points' ),
          events = require( '../src/events' );

    send.setSlackClient( slackClientMock );
    points.updateScore = jest.fn();

    events.handlePlusMinus( item, '+', channel );

    expect( points.updateScore )
      .toHaveBeenCalledTimes( 1 )
      .toHaveBeenCalledWith( item, '+' );
  });

  it.each([ [ 'plus', '+' ], [ 'minus', '-' ] ])(
    'gets a message from the \'%s\' collection',
    ( operationName, operation ) => {
      expect.hasAssertions();

      const send = require( '../src/send' ),
            points = require( '../src/points' ),
            events = require( '../src/events' ),
            messages = require( '../src/messages' );

      send.setSlackClient( slackClientMock );
      points.updateScore = jest.fn( updateScoreMock );
      messages.getRandomMessage = jest.fn();

      return events.handlePlusMinus( item, operation, channel ).then( () => {
        expect( messages.getRandomMessage )
          .toHaveBeenCalledTimes( 1 )
          .toHaveBeenCalledWith( operationName, item, score );
      });
    }
  );

  it( 'sends a message back to the channel that called it', () => {
    expect.hasAssertions();

    const send = require( '../src/send' ),
          points = require( '../src/points' ),
          events = require( '../src/events' );

    send.setSlackClient( slackClientMock );
    points.updateScore = jest.fn();
    send.sendMessage = jest.fn();

    return events.handlePlusMinus( item, '+', channel ).then( () => {
      expect( send.sendMessage )
        .toHaveBeenCalledTimes( 1 )
        .toHaveBeenCalledWith( expect.stringContaining( item ), channel );
    });
  });

});

describe( 'handlers.message', () => {

  it( 'drops a user trying to ++ themselves', () => {
    const event = {
      type: 'message',
      text: '<@U12345678>++',
      user: 'U12345678'
    };

    expect( handlers.message( event ) ).toBeFalse();
  });

}); // HandleMessageEvent.

describe( 'handlers.appMention', () => {

  // TODO:

});

describe( 'handleEvent', () => {

  const validEvents = [
    'message',
    'app_mention'
  ];

  for ( const eventName of validEvents ) {

    it( 'returns a Promise for a \'' + eventName + '\' event with text', () => {
      const event = {
        type: eventName,
        text: '@Hello++'
      };

      expect( events.handleEvent( event ) instanceof Promise ).toBeTrue();
    });

    it( 'reports a \'' + eventName + '\' event without text as invalid', () => {
      const event = { type: eventName };
      expect( events.handleEvent( event ) ).toBeFalse();
    });

    it( 'reports a \'' + eventName + '\' event with only a space for text as invalid', () => {
      const event = {
        type: eventName,
        text: ' '
      };

      expect( events.handleEvent( event ) ).toBeFalse();
    });

  } // For validEvents.

  it( 'reports an event with missing type as invalid', () => {
    const event = { text: 'Hello' };
    expect( events.handleEvent( event ) ).toBeFalse();
  });

  it( 'reports an event with some random type as invalid', () => {
    const event = {
      type: 'random',
      text: 'Hello'
    };

    expect( events.handleEvent( event ) ).toBeFalse();
  });

  it( 'reports an event with a subtype as invalid', () => {
    const event = {
      type: 'message',
      subtype: 'random',
      text: 'Hello'
    };

    expect( events.handleEvent( event ) ).toBeFalse();
  });

}); // HandleEvent.
