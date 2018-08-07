/**
 * Tests the main ./index.js file.
 *
 * TODO: Add a lot more tests to this.
 *
 * @author Tim Malone <tdmalone@gmail.com>
 */

/* global expect */

'use strict';

// Start the Express server.
require( '../' );

const http = require( 'http' );

/* eslint-disable no-process-env, no-magic-numbers */
const PORT = process.env.PORT || 80;
/* eslint-enable no-process-env, no-magic-numbers */

const HTTP_200 = 200,
      HTTP_500 = 500;

test( 'Server returns HTTP 200 for GET operations', done => {
  http.get( 'http://localhost:' + PORT, response => {
    expect( response.statusCode ).toBe( HTTP_200 );
    done();
  });
});

test( 'Server correctly returns the Slack event challenge value', done => {

  const requestOptions = {
    host:   'localhost',
    method: 'POST',
    port:   PORT,

    headers: {
      'Content-Type': 'application/json'
    }
  };

  const requestBody = {
    challenge: Math.random().toString()
  };

  const request = http.request( requestOptions, response => {
    let data = '';
    response.on( 'data', chunk => {
      data += chunk;
    }).on( 'end', () => {
      expect( response.statusCode ).toBe( HTTP_200 );
      expect( data ).toBe( requestBody.challenge );
      done();
    });
  });

  request.write( JSON.stringify( requestBody ) );
  request.end();
});

test( 'Server returns HTTP 500 when no verification token is set', done => {

  const requestOptions = {
    host:   'localhost',
    method: 'POST',
    port:   PORT
  };

  http.request( requestOptions, response => {
    expect( response.statusCode ).toBe( HTTP_500 );
    done();
  }).end();
});
