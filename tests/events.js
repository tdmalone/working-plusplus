/**
 * Unit tests on the event handlers in events.js.
 *
 * TODO: These tests are currently generating an unhandled Promise (probably from the Slack client)
 *       and need to be updated.
 *
 * @see https://jestjs.io/docs/en/expect
 * @author Tim Malone <tdmalone@gmail.com>
 */

/* global jest */

'use strict';

const events = require( '../src/events' );
const handlers = events.handlers;

// Catch all console output during tests.
console.error = jest.fn();
console.info = jest.fn();
console.log = jest.fn();
console.warn = jest.fn();

describe( 'handleSelfPlus', () => {

  // TODO:

});

describe( 'handlePlusMinus', () => {

  // TODO:

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
