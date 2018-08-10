/**
 * Unit tests on the main app.js file.
 *
 * @see https://jestjs.io/docs/en/expect
 * @author Tim Malone <tdmalone@gmail.com>
 */

'use strict';

const app = require( '../src/app' ),
      slackClientMock = require( './mocks/slack' );

app.setSlackClient( slackClientMock );

/********************
 * IsValidEvent.
 ********************/

test( 'Event with message and text is reported as valid', () => {
  const event = {
    type: 'message',
    text: 'Hello'
  };

  expect( app.isValidEvent( event ) ).toBe( true );
});

test( 'Event with missing type is caught as invalid', () => {
  const event = { text: 'Hello' };
  expect( app.isValidEvent( event ) ).toBe( false );
});

test( 'Event with non-message type is caught as invalid', () => {
  const event = {
    type: 'random',
    text: 'Hello'
  };

  expect( app.isValidEvent( event ) ).toBe( false );
});

test( 'Event with a subtype is caught as invalid', () => {
  const event = {
    type: 'message',
    subtype: 'random',
    text: 'Hello'
  };

  expect( app.isValidEvent( event ) ).toBe( false );
});

test( 'Event without text set is caught as invalid', () => {
  const event = { type: 'message' };
  expect( app.isValidEvent( event ) ).toBe( false );
});

test( 'Event with only a space as text is caught as invalid', () => {
  const event = {
    type: 'message',
    text: ' '
  };

  expect( app.isValidEvent( event ) ).toBe( false );
});

/********************
 * HandleEvent.
 ********************/

test( 'Message without an @ symbol is dropped', () => {
  const event = {
    type: 'message',
    text: 'Hello++'
  };

  expect.assertions( 1 );

  return app.handleEvent( event ).then( data => {
    expect( data ).toBe( false );
  });
});

test( 'Message without a valid operation is dropped', () => {
  const event = {
    type: 'message',
    text: '@Hello'
  };

  expect.assertions( 1 );

  return app.handleEvent( event ).then( data => {
    expect( data ).toBe( false );
  });
});

test( 'Message without a valid user/item is dropped', () => {
  const event = {
    type: 'message',
    text: '@++'
  };

  expect.assertions( 1 );

  return app.handleEvent( event ).then( data => {
    expect( data ).toBe( false );
  });
});

test( 'User trying to ++ themselves is dropped', () => {
  const event = {
    type: 'message',
    text: '<@U12345678>++',
    user: 'U12345678'
  };

  expect.assertions( 1 );

  return app.handleEvent( event ).then( data => {
    expect( data ).toBe( false );
  });
});
