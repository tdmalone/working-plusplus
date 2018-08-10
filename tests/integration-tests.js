/**
 * Integration tests.
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
      config = require( './_config' ),
      runner = require( './_runner' ),
      slackClientMock = require( './mocks/slack' );

const originalProcessEnv = process.env;
const postgres = new pg.Pool( config.postgresPoolConfig );

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
  await dbClient.query( 'DROP TABLE IF EXISTS ' + config.scoresTableName );
  await dbClient.query( 'DROP EXTENSION IF EXISTS CITEXT' );
});

// Clear module cache + reset environment variables before each test.
beforeEach( () => {
  jest.resetModules();
  process.env = { ...originalProcessEnv };
});

/****************************************************************
 * Express Server Tests.
 ****************************************************************/

test( 'Server returns HTTP 200 for GET operations', done => {
  expect.assertions( 1 );

  const listener = require( '../' )();

  listener.on( 'listening', () => {
    http.get( 'http://localhost:' + config.PORT, response => {
      listener.close();
      expect( response.statusCode ).toBe( 200 );
      done();
    });
  });

});

test( 'Server correctly returns the Slack event challenge value', done => {
  expect.assertions( 2 );

  const listener = require( '../' )();
  const requestBody = { challenge: Math.random().toString() };

  listener.on( 'listening', () => {
    const request = http.request( config.defaultRequestOptions, response => {
      let data = '';

      response.on( 'data', chunk => {
        data += chunk;
      }).on( 'end', () => {
        listener.close();
        expect( response.statusCode ).toBe( 200 );
        expect( data ).toBe( requestBody.challenge );
        done();
      });
    });

    request.write( JSON.stringify( requestBody ) );
    request.end();

  });
});

test( 'Server returns HTTP 500 when no verification token is set', done => {
  expect.assertions( 1 );

  delete process.env.SLACK_VERIFICATION_TOKEN;
  const listener = require( '../' )();

  listener.on( 'listening', () => {
    http.request( config.defaultRequestOptions, response => {
      listener.close();
      expect( response.statusCode ).toBe( 500 );
      done();
    }).end();
  });

});

test( 'Server returns HTTP 500 when verification token is still set to the default', done => {
  expect.assertions( 1 );

  process.env.SLACK_VERIFICATION_TOKEN = 'xxxxxxxxxxxxxxxxxxxxxxxx';
  const listener = require( '../' )();

  listener.on( 'listening', () => {
    http.request( config.defaultRequestOptions, response => {
      listener.close();
      expect( response.statusCode ).toBe( 500 );
      done();
    }).end();
  });

});

test( 'Server returns HTTP 403 when verification token is incorrect', done => {
  expect.assertions( 1 );

  const listener = require( '../' )();
  const body = { token: 'something_is_not_right' };

  listener.on( 'listening', () => {

    const request = http.request( config.defaultRequestOptions, response => {
      listener.close();
      expect( response.statusCode ).toBe( 403 );
      done();
    });

    request.write( JSON.stringify( body ) );
    request.end();

  });
});

test( 'POST request handler responds to Slack on retries, but then drops the event', () => {
  expect.assertions( 4 );

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
  'SELECT 1 FROM information_schema.tables WHERE table_name = \'' + config.scoresTableName + '\'' +
')';

const extensionExistsQuery = 'SELECT * FROM pg_extension WHERE extname = \'citext\'';

test( 'Database table does not exist yet', async() => {
  expect.assertions( 1 );
  const dbClient = await postgres.connect();
  const query = await dbClient.query( tableExistsQuery );
  expect( query.rows[0].exists ).toBe( false );
});

test( 'Database case-insensitive extension does not exist yet', async() => {
  expect.assertions( 1 );
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
  const listener = require( '../' )({ slack: slackClientMock });

  listener.on( 'listening', () => {
    runner( '@something++', async( dbClient ) => {
      listener.close();
      const query = await dbClient.query( tableExistsQuery );
      expect( query.rows[0].exists ).toBe( true );
      done();
    });
  });
};

test( 'Database table gets created on first request', doFirstRequest );

test( 'Database case-insensitive extension now exists too', async() => {
  expect.assertions( 1 );
  const dbClient = await postgres.connect();
  const query = await dbClient.query( extensionExistsQuery );
  expect( query.rowCount ).toBe( 1 );
});

test( 'The first test can be repeated without causing errors', doFirstRequest );
