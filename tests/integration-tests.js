/**
 * Integration tests on the main ./index.js file.
 *
 * @see https://jestjs.io/docs/en/expect
 * @see https://jestjs.io/docs/en/asynchronous.html
 * @see https://jestjs.io/docs/en/mock-functions#mocking-modules
 * @author Tim Malone <tdmalone@gmail.com>
 */

'use strict';

/****************************************************************
 * Environment Configuration.
 ****************************************************************/

const http = require( 'http' ),
      pg = require( 'pg' ),
      app = require( '../src/app' ),
      slackClientMock = require( './mocks/slack' );

/* eslint-disable no-process-env, no-magic-numbers */
const originalProcessEnv = process.env;
const PORT = process.env.PORT || 80,
      SLACK_VERIFICATION_TOKEN = process.env.SLACK_VERIFICATION_TOKEN,
      DATABASE_URL = process.env.DATABASE_URL,
      DATABASE_USE_SSL = 'false' === process.env.DATABASE_USE_SSL ? false : true;
/* eslint-enable no-process-env, no-magic-numbers */

const HTTP_200 = 200,
      HTTP_403 = 403,
      HTTP_500 = 500;

// Time (in ms) that we should wait after HTTP requests return, before testing any of the results.
const HTTP_RETURN_DELAY = 100;

const scoresTableName = 'scores',
      postgresPoolConfig = {
        connectionString: DATABASE_URL,
        ssl: DATABASE_USE_SSL
      };

const postgres = new pg.Pool( postgresPoolConfig );

const defaultRequestOptions = {
  host: 'localhost',
  method: 'POST',
  port: PORT,
  headers: { 'Content-Type': 'application/json' }
};

/****************************************************************
 * Jest Setup.
 ****************************************************************/

// Catch all console output during tests.
console.error = jest.fn();
console.info = jest.fn();
console.log = jest.fn();
console.warn = jest.fn();

// Drop the scores table + case insensitive extension before we start, as our tests rely on that.
beforeAll( async() => {
  const dbClient = await postgres.connect();
  await dbClient.query( 'DROP TABLE IF EXISTS ' + scoresTableName );
  await dbClient.query( 'DROP EXTENSION IF EXISTS CITEXT' );
});

// Clear module cache + reset environment variables before each test.
beforeEach( () => {
  jest.resetModules();
  process.env = { ...originalProcessEnv }; // eslint-disable-line no-process-env
});

/****************************************************************
 * Boilerplate.
 ****************************************************************/

/**
 * Encapsulates all the boilerplate required to run the full request cycle for end-to-end tests.
 * @param {string}   text     Message text to 'send' from a Slack user to the app.
 * @param {callable} callback Function to call when the state is ready to test against.
 * @returns {void}
 */
const testRunner = async( text, callback ) => {
  const listener = require( '../' )({ slack: slackClientMock });

  const body = {
    token: SLACK_VERIFICATION_TOKEN,
    event: {
      type: 'message',
      text: text
    }
  };

  listener.on( 'listening', () => {

    const request = http.request( defaultRequestOptions, response => {
      let data = '';

      response.on( 'data', chunk => {
        data += chunk;
      }).on( 'end', async() => {

        console.log( data );
        listener.close();

        // Wait for the operations after the HTTP requests returns to be completed before testing.
        setTimeout( async() => {
          const dbClient = await postgres.connect();
          callback( dbClient );
        }, HTTP_RETURN_DELAY );

      });
    }); // Http.request.

    request.write( JSON.stringify( body ) );
    request.end();

  }); // Listener listening.
}; // TestRunner.

/****************************************************************
 * Express Server Tests.
 ****************************************************************/

test( 'Server returns HTTP 200 for GET operations', done => {
  const listener = require( '../' )();

  listener.on( 'listening', () => {
    http.get( 'http://localhost:' + PORT, response => {
      listener.close();
      expect( response.statusCode ).toBe( HTTP_200 );
      done();
    });
  });

});

test( 'Server correctly returns the Slack event challenge value', done => {

  const listener = require( '../' )();
  const requestBody = { challenge: Math.random().toString() };

  listener.on( 'listening', () => {
    const request = http.request( defaultRequestOptions, response => {
      let data = '';

      response.on( 'data', chunk => {
        data += chunk;
      }).on( 'end', () => {
        listener.close();
        expect( response.statusCode ).toBe( HTTP_200 );
        expect( data ).toBe( requestBody.challenge );
        done();
      });
    });

    request.write( JSON.stringify( requestBody ) );
    request.end();

  });
});

test( 'Server returns HTTP 500 when no verification token is set', done => {

  // eslint-disable-next-line no-process-env
  delete process.env.SLACK_VERIFICATION_TOKEN;
  const listener = require( '../' )();

  listener.on( 'listening', () => {
    http.request( defaultRequestOptions, response => {
      listener.close();
      expect( response.statusCode ).toBe( HTTP_500 );
      done();
    }).end();
  });

});

test( 'Server returns HTTP 500 when verification token is still set to the default', done => {

  // eslint-disable-next-line no-process-env
  process.env.SLACK_VERIFICATION_TOKEN = 'xxxxxxxxxxxxxxxxxxxxxxxx';
  const listener = require( '../' )();

  listener.on( 'listening', () => {
    http.request( defaultRequestOptions, response => {
      listener.close();
      expect( response.statusCode ).toBe( HTTP_500 );
      done();
    }).end();
  });

});

test( 'Server returns HTTP 403 when verification token is incorrect', done => {

  const listener = require( '../' )();
  const body = { token: 'something_is_not_right' };

  listener.on( 'listening', () => {

    const request = http.request( defaultRequestOptions, response => {
      listener.close();
      expect( response.statusCode ).toBe( HTTP_403 );
      done();
    });

    request.write( JSON.stringify( body ) );
    request.end();

  });
});

test( 'POST request handler responds to Slack on retries, but then drops the event', () => {
  const mockExpress = require( './mocks/express' );

  // The first time, we expect an error because we haven't put a valid event together yet.

  mockExpress.response.send = jest.fn();

  expect( () => {
    app.handlePost( mockExpress.request, mockExpress.response );
  }).toThrow();

  expect( mockExpress.response.send ).toHaveBeenCalledTimes( 1 );

  // The second time, we clear the mocks, and then pretend Slack is retrying a request.
  // This one should simply return false.

  mockExpress.response.send.mockClear();
  mockExpress.request.headers['x-slack-retry-num'] = 1;
  const result = app.handlePost( mockExpress.request, mockExpress.response );
  expect( result ).toBe( false );
  expect( mockExpress.response.send ).toHaveBeenCalledTimes( 1 );

});

/****************************************************************
 * Postgres Tests.
 ****************************************************************/

const tableExistsQuery = 'SELECT EXISTS ( ' +
  'SELECT 1 FROM information_schema.tables WHERE table_name = \'' + scoresTableName + '\'' +
')';

const extensionExistsQuery = 'SELECT * FROM pg_extension WHERE extname = \'citext\'';

test( 'Database table does not exist yet', async() => {
  const dbClient = await postgres.connect();
  const query = await dbClient.query( tableExistsQuery );
  expect( query.rows[0].exists ).toBe( false );
});

test( 'Database case-insensitive extension does not exist yet', async() => {
  const dbClient = await postgres.connect();
  const query = await dbClient.query( extensionExistsQuery );
  expect( query.rowCount ).toBe( 0 );
});

/**
 * Provides a 'first request' and a test that it successfully creates the database table.
 *
 * @param {callable} done A callback to use for alerting Jest that the test is complete.
 * @return {void}
 */
const doFirstRequest = ( done ) => {
  expect.assertions( 1 );

  testRunner( '@something++', async( dbClient ) => {
    const queryAfter = await dbClient.query( tableExistsQuery );
    expect( queryAfter.rows[0].exists ).toBe( true );
    done();
  });
};

test( 'Database table gets created on first request', doFirstRequest );

test( 'Database case-insensitive extension now exists too', async() => {
  const dbClient = await postgres.connect();
  const query = await dbClient.query( extensionExistsQuery );
  expect( query.rowCount ).toBe( 1 );
});

test( 'The first test can be repeated without causing errors', doFirstRequest );

/****************************************************************
 * End-to-end tests.
 ****************************************************************/

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
