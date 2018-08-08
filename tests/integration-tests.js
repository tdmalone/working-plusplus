/**
 * Integration tests on the main ./index.js file.
 *
 * TODO: Add a lot more tests to this.
 *
 * @see https://jestjs.io/docs/en/expect
 * @author Tim Malone <tdmalone@gmail.com>
 */

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

// TODO: Mock Slack.
// TODO: Mock Postgres (or use a local server).

// TODO: Test server returns HTTP 403 when incorrect verification token is supplied.
// TODO: Test server drops Slack retries.

// TODO: Test DB table gets created.
// TODO: Test CITEXT extension is added if not exists.

// TODO: Test ++ works for brand new 'thing' A and then equals 1.
// TODO: Test -- works for brand new 'thing' B and then equals -1.
// TODO: Test ++ works for existing 'thing' A and then equals 2.
// TODO: Test -- works for existing 'thing' B and then equals -2.
// TODO: Test ++ works for existing 'thing' A with different case and then equals 3.
// TODO: Test ++ works for brand new user C and then equals 1.
// TODO: Test -- works for brand new user D and then equals -1.
// TODO: Test ++ works for existing user C and then equals 2.
// TODO: Test -- works for existing user D and then equals -2.
// TODO: Test self ++ fails for existing user C and then still equals 2.
// TODO: Test self -- works for existing user D and then equals -3.

// TODO: Test DB table doesn't get recreated/error.
// TODO: Test CITEXT extension doesn't error if running again.

// TODO: Test ++ works for existing user and then equals 3.

// TODO: Test Slack message is sent containing user C link after self++.
// TODO: Test Slack message is sent containing user C link and score 3 after ++.
// TODO: Test Slack message is sent containing user D link and score -4 after --.

// TODO: Test Slack message is sent containing singular 'point' after 'thing' E ++.
// TODO: Test Slack message is sent containing plural 'points' after 'thing' E ++.
// TODO: Test Slack message is sent containing singular 'point' after 'thing' F --.
// TODO: Test Slack message is sent containing plural 'points' after 'thing' F --.
// TODO: Test Slack message is sent containing plural 'points' after 'thing' G ++ and then --.

// TODO: Test Slack message contains <@ and > after user H ++.
// TODO: Test Slack message does not contain <@ and > after 'thing' I ++.

// TODO: Test Slack message can be found in 'plus' messages after user H ++.
// TODO: Test Slack message can be found in 'minus' messages after user H --.
// TODO: Test Slack message can be found in 'selfPlus' messages after self++.
