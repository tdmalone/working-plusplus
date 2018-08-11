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
 * ExtractEventData.
 ********************/

test( 'Message without an @ symbol is dropped', () => {
  expect( app.extractEventData( 'Hello++' ) ).toBe( false );
});

test( 'Message without a valid operation is dropped', () => {
  expect( app.extractEventData( '@Hello' ) ).toBe( false );
});

test( 'Message without a valid user/item is dropped', () => {
  expect( app.extractEventData( '@++' ) ).toBe( false );
});

test( 'Extraction works at the start of the message for a thing', () => {
  expect( app.extractEventData( '@SomethingRandom++ that was awesome' ) ).toEqual({
    item: 'SomethingRandom',
    operation: '+'
  });
});

test( 'Extraction works at the start of the message for a user', () => {
  expect( app.extractEventData( '<@U87654321>++ that was awesome' ) ).toEqual({
    item: 'U87654321',
    operation: '+'
  });
});

test( 'Extraction works in the middle of the message', () => {
  expect( app.extractEventData( 'Hey @SomethingRandom++ that was awesome' ) ).toEqual({
    item: 'SomethingRandom',
    operation: '+'
  });
});

test( 'Extraction works at the end of the message', () => {
  expect( app.extractEventData( 'Awesome work @SomethingRandom++' ) ).toEqual({
    item: 'SomethingRandom',
    operation: '+'
  });
});

const itemsToMatch = [
  {
    supplied: '<@U1234567890>',
    expected: 'U1234567890'
  },
  {
    supplied: '@SomethingRandom',
    expected: 'SomethingRandom'
  },
  {
    supplied: '@SomethingRandom123',
    expected: 'SomethingRandom123'
  }
];

const operationsToMatch = [
  {
    supplied: '++',
    expected: '+'
  },
  {
    supplied: '--',
    expected: '-'
  },
  {
    supplied: '—', // Emdash, which iOS replaces -- with.
    expected: '-'
  }
];

const operationsNotToMatch = [
  '+',
  '-'
];

for ( const item of itemsToMatch ) {
  for ( const operation of operationsToMatch ) {
    for ( let iterator = 0; 1 >= iterator; iterator++ ) {

      const space = 1 === iterator ? ' ' : '',
            messageText = item.supplied + space + operation.supplied,
            testName = (
              messageText + ' is matched successfully as ' +
              item.expected + ' and ' + operation.expected
            );

      test( testName, () => {
        const result = app.extractEventData( messageText );
        expect( result ).toEqual({
          item: item.expected,
          operation: operation.expected
        });
      });

    }
  }

  for ( const operation of operationsNotToMatch ) {
    const messageText = item.supplied + operation;
    test( messageText + ' is NOT matched', () => {
      expect( app.extractEventData( messageText ) ).toBe( false );
    });
  }

}

/*****************************
 * RespondToUser & UpdateScore
 *****************************

// These functions are both suitably covered in the end-to-end tests, and are probably difficult to
// test as individual units.

/********************
 * HandleEvent.
 ********************/

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
 * LogRequest.
 ********************/

test( 'LogRequest successfully logs request data', () => {
  const mockExpress = require( './mocks/express' );
  console.log = jest.fn();
  app.logRequest( mockExpress.request );

  expect( console.log )
    .toHaveBeenCalledTimes( 1 )
    .toHaveBeenCalledWith( expect.stringContaining( mockExpress.request.ip ) )
    .toHaveBeenCalledWith( expect.stringContaining( mockExpress.request.method ) )
    .toHaveBeenCalledWith( expect.stringContaining( mockExpress.request.path ) )
    .toHaveBeenCalledWith( expect.stringContaining( mockExpress.request.headers['user-agent']) );

});

/********************
 * ValidateToken.
 ********************/

test( 'Invalid tokens return a status code and an error message', () => {
  expect( app.validateToken( 'something', '' ) )
    .toHaveProperty( 'error', expect.any( Number ) )
    .toHaveProperty( 'message', expect.any( String ) );
});

test( 'Invalid tokens log an error', () => {
  console.error = jest.fn();
  app.validateToken( 'something', '' );
  expect( console.error ).toHaveBeenCalledTimes( 1 );
});

test( 'Non-matching tokens log an error', () => {
  console.error = jest.fn();
  app.validateToken( 'something', 'something-else' );
  expect( console.error ).toHaveBeenCalledTimes( 1 );
});

test( 'A blank token on the server side returns a 500 status code', () => {
  expect( app.validateToken( 'something', '' ).error ).toEqual( 500 );
});

test( 'A token made up of spaces on the server side returns a 500 status code', () => {
  expect( app.validateToken( 'something', '  ' ).error ).toEqual( 500 );
});

test( 'A token left as the default on the server side returns a 500 status code', () => {
  expect( app.validateToken( 'something', 'xxxxxxxxxxxxxxxxxxxxxxxx' ).error ).toEqual( 500 );
});

test( 'A token that does NOT match returns a 403 status code', () => {
  expect( app.validateToken( 'something', 'something-else' ).error ).toEqual( 403 );
});

test( 'A token that does match returns true', () => {
  expect( app.validateToken( 'something', 'something' ) ).toBe( true );
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

  mockExpress.request.method = 'GET';

  app.handleGet( mockExpress.request, mockExpress.response );
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

  expect( console.log )
    .toHaveBeenCalledTimes( 1 )
    .toHaveBeenCalledWith( expect.stringContaining( mockExpress.request.ip ) );

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
