/**
 * Unit tests on the main app.js file.
 *
 * @see https://jestjs.io/docs/en/expect
 * @author Tim Malone <tdmalone@gmail.com>
 */

/* global jest */

'use strict';

const app = require( '../src/app' ),
      slackClientMock = require( './mocks/slack' );

app.setSlackClient( slackClientMock );

// Catch all console output during tests.
console.error = jest.fn();
console.info = jest.fn();
console.log = jest.fn();
console.warn = jest.fn();

describe( 'isValidEvent', () => {

  it( 'reports an event with message and text as valid', () => {
    const event = {
      type: 'message',
      text: 'Hello'
    };

    expect( app.isValidEvent( event ) ).toBe( true );
  });

  it( 'reports an event with missing type as invalid', () => {
    const event = { text: 'Hello' };
    expect( app.isValidEvent( event ) ).toBe( false );
  });

  it( 'reports an event without type \'message\' as invalid', () => {
    const event = {
      type: 'random',
      text: 'Hello'
    };

    expect( app.isValidEvent( event ) ).toBe( false );
  });

  it( 'reports an event with a subtype as invalid', () => {
    const event = {
      type: 'message',
      subtype: 'random',
      text: 'Hello'
    };

    expect( app.isValidEvent( event ) ).toBe( false );
  });

  it( 'reports an event without text as invalid', () => {
    const event = { type: 'message' };
    expect( app.isValidEvent( event ) ).toBe( false );
  });

  it( 'reports an event with only a space for text as invalid', () => {
    const event = {
      type: 'message',
      text: ' '
    };

    expect( app.isValidEvent( event ) ).toBe( false );
  });

}); // IsValidEvent.

describe( 'extractEventData', () => {

  it( 'drops message without an @ symbol', () => {
    expect( app.extractEventData( 'Hello++' ) ).toBe( false );
  });

  it( 'drops messages without a valid operation', () => {
    expect( app.extractEventData( '@Hello' ) ).toBe( false );
  });

  it( 'drops messages without a valid user/item', () => {
    expect( app.extractEventData( '@++' ) ).toBe( false );
  });

  it( 'extracts a \'thing\' and operation from the start of a message', () => {
    expect( app.extractEventData( '@SomethingRandom++ that was awesome' ) ).toEqual({
      item: 'SomethingRandom',
      operation: '+'
    });
  });

  it( 'extracts a user and operation from the start of a message', () => {
    expect( app.extractEventData( '<@U87654321>++ that was awesome' ) ).toEqual({
      item: 'U87654321',
      operation: '+'
    });
  });

  it( 'extracts data in the middle of a message', () => {
    expect( app.extractEventData( 'Hey @SomethingRandom++ that was awesome' ) ).toEqual({
      item: 'SomethingRandom',
      operation: '+'
    });
  });

  it( 'extracts data at the end of a message', () => {
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
                'matches ' + messageText + ' as ' + item.expected + ' and ' + operation.expected
              );

        it( testName, () => {
          const result = app.extractEventData( messageText );
          expect( result ).toEqual({
            item: item.expected,
            operation: operation.expected
          });
        });

      } // For iterator.
    } // For operationsToMatch.

    for ( const operation of operationsNotToMatch ) {
      const messageText = item.supplied + operation;
      it( 'does NOT match ' + messageText, () => {
        expect( app.extractEventData( messageText ) ).toBe( false );
      });
    }

  } // For itemsToMatch.
}); // ExtractEventData.

/**
 * These functions are both suitably covered in the end-to-end tests, and are probably difficult to
 * test as individual units.
 */
describe( 'respondToUser', () => {});
describe( 'updateScore', () => {});

describe( 'handleEvent', () => {

  it( 'drops a user trying to ++ themselves', () => {
    const event = {
      type: 'message',
      text: '<@U12345678>++',
      user: 'U12345678'
    };

    expect.hasAssertions();

    return app.handleEvent( event ).then( ( data ) => {
      expect( data ).toBe( false );
    });
  });

});

describe( 'logRequest', () => {

  it( 'logs request data to stdout', () => {
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

});

describe( 'validateToken', () => {

  it( 'returns a status code and error message for invalid tokens', () => {
    expect( app.validateToken( 'something', '' ) )
      .toHaveProperty( 'error', expect.any( Number ) )
      .toHaveProperty( 'message', expect.any( String ) );
  });

  it( 'logs an error to stdout for invalid tokens', () => {
    console.error = jest.fn();
    app.validateToken( 'something', '' );
    expect( console.error ).toHaveBeenCalledTimes( 1 );
  });

  it( 'logs an error to stdout for non-matching tokens', () => {
    console.error = jest.fn();
    app.validateToken( 'something', 'something-else' );
    expect( console.error ).toHaveBeenCalledTimes( 1 );
  });

  it( 'returns a 500 status code for a blank token on the server side', () => {
    expect( app.validateToken( 'something', '' ).error ).toEqual( 500 );
  });

  it( 'returns a 500 status code for a token on the server side made up of spaces', () => {
    expect( app.validateToken( 'something', '  ' ).error ).toEqual( 500 );
  });

  it( 'returns a 500 status code for a token on the server side left as default', () => {
    expect( app.validateToken( 'something', 'xxxxxxxxxxxxxxxxxxxxxxxx' ).error ).toEqual( 500 );
  });

  it( 'returns a 403 status code for a token that does NOT match', () => {
    expect( app.validateToken( 'something', 'something-else' ).error ).toEqual( 403 );
  });

  it( 'returns true for a token that DOES match', () => {
    expect( app.validateToken( 'something', 'something' ) ).toBe( true );
  });

}); // ValidateToken.

describe( 'handleGet', () => {

  it( 'logs requests to stdout', () => {
    const mockExpress = require( './mocks/express' );
    mockExpress.request.method = 'GET';
    console.log = jest.fn();

    try {
      app.handleGet( mockExpress.request, mockExpress.response );
    } catch ( error ) {} // eslint-disable-line no-empty

    expect( console.log )
      .toHaveBeenCalledTimes( 1 )
      .toHaveBeenCalledWith( expect.stringContaining( mockExpress.request.ip ) );
  });

  it( 'sends a simple response for incoming requests', () => {
    let receivedResponse;
    const mockExpress = require( './mocks/express' );
    mockExpress.request.method = 'GET';

    mockExpress.response.send = ( response ) => {
      receivedResponse = response;
    };

    app.handleGet( mockExpress.request, mockExpress.response );
    expect( typeof receivedResponse ).toBe( 'string' );
  });

}); // HandleGet.

describe( 'handlePost', () => {

  it( 'logs requests to stdout', () => {
    const mockExpress = require( './mocks/express' );
    console.log = jest.fn();

    try {
      app.handlePost( mockExpress.request, mockExpress.response );
    } catch ( error ) {} // eslint-disable-line no-empty

    expect( console.log )
      .toHaveBeenCalledTimes( 1 )
      .toHaveBeenCalledWith( expect.stringContaining( mockExpress.request.ip ) );
  });

  it( 'responds with a challenge value when received', () => {

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

}); // HandlePost.
