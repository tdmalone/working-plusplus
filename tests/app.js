/**
 * Unit tests on the main app.js file.
 *
 * @see https://jestjs.io/docs/en/expect
 * @see https://github.com/jest-community/jest-extended#api
 * @author Tim Malone <tdmalone@gmail.com>
 */

/* global jest */

'use strict';

const app = require( '../src/app' );

// Catch all console output during tests.
console.error = jest.fn();
console.info = jest.fn();
console.log = jest.fn();
console.warn = jest.fn();

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
    expect( app.validateToken( 'something', 'something' ) ).toBeTrue();
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
    expect( result ).toBeFalse();

  });

}); // HandlePost.
