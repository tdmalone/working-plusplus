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

// Catch all console output during tests.
console.error = jest.fn();
console.info = jest.fn();
console.log = jest.fn();
console.warn = jest.fn();

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

  expect.hasAssertions();

  return app.handleEvent( event ).then( data => {
    expect( data ).toBe( false );
  });
});

test( 'Message without a valid operation is dropped', () => {
  const event = {
    type: 'message',
    text: '@Hello'
  };

  expect.hasAssertions();

  return app.handleEvent( event ).then( data => {
    expect( data ).toBe( false );
  });
});

test( 'Message without a valid user/item is dropped', () => {
  const event = {
    type: 'message',
    text: '@++'
  };

  expect.hasAssertions();

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

  expect.hasAssertions();

  return app.handleEvent( event ).then( data => {
    expect( data ).toBe( false );
  });
});

/********************
 * HandleGet.
 ********************/

test( 'GET request handler sends a response', () => {

  let receivedResponse;
  const mockExpress = require( './mocks/express' );
  mockExpress.response.send = ( response ) => {
    receivedResponse = response;
  };

  app.handleGet( null, mockExpress.response );
  expect( typeof receivedResponse ).toBe( 'string' );

});

/********************
 * HandlePost.
 ********************/

test( 'POST request handler logs requests', () => {
  const mockExpress = require( './mocks/express' );

  console.log = jest.fn();

  try {
    app.handlePost( mockExpress.request, mockExpress.response );
  } catch ( error ) {} // eslint-disable-line no-empty

  expect( console.log ).toBeCalledWith( expect.stringContaining( mockExpress.request.ip ) );

});

test( 'POST request handler responds with challenge', () => {

  let receivedResponse;
  const mockExpress = require( './mocks/express' );
  mockExpress.response.send = ( response ) => {
    receivedResponse = response;
  };

  mockExpress.request.body.challenge = Math.random().toString();
  const result = app.handlePost( mockExpress.request, mockExpress.response );
  expect( receivedResponse ).toBe( mockExpress.request.body.challenge );
  expect( result ).toBe( false );

});
