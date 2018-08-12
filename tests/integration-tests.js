/**
 * Integration tests.
 *
 * @see https://jestjs.io/docs/en/expect
 * @see https://github.com/jest-community/jest-extended#api
 * @see https://jestjs.io/docs/en/asynchronous.html
 * @see https://jestjs.io/docs/en/mock-functions#mocking-modules
 * @author Tim Malone <tdmalone@gmail.com>
 */

/* global jest */

'use strict';

/****************************************************************
 * Environment Configuration.
 ****************************************************************/

const app = require( '../src/app' );
const pathToListener = '../';

const pg = require( 'pg' ),
      http = require( 'http' );

const config = require( './_config' ),
      runner = require( './_runner' ),
      slackClientMock = require( './mocks/slack' );

const originalProcessEnv = process.env,
      postgres = new pg.Pool( config.postgresPoolConfig );

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
  await dbClient.release();
});

// Clear module cache + reset environment variables before each test.
beforeEach( () => {
  jest.resetModules();
  process.env = { ...originalProcessEnv };
});

/****************************************************************
 * Express Server tests.
 ****************************************************************/

describe( 'The Express server', () => {

  it( 'returns HTTP 200 for GET operations', ( done ) => {
    expect.hasAssertions();

    const listener = require( pathToListener )();

    listener.on( 'listening', () => {
      http.get( 'http://localhost:' + config.PORT, ( response ) => {
        listener.close();
        expect( response.statusCode ).toBe( 200 );
        done();
      });
    });

  });

  it( 'correctly returns the Slack event challenge value', ( done ) => {
    expect.assertions( 2 );

    const listener = require( pathToListener )();
    const requestBody = { challenge: Math.random().toString() };

    listener.on( 'listening', () => {
      const request = http.request( config.defaultRequestOptions, ( response ) => {
        let data = '';

        response.on( 'data', ( chunk ) => {
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

  it( 'returns HTTP 500 when no verification token is set', ( done ) => {
    expect.hasAssertions();

    delete process.env.SLACK_VERIFICATION_TOKEN;
    const listener = require( pathToListener )();

    listener.on( 'listening', () => {
      http.request( config.defaultRequestOptions, ( response ) => {
        listener.close();
        expect( response.statusCode ).toBe( 500 );
        done();
      }).end();
    });

  });

  it( 'returns HTTP 500 when verification token is still set to the default', ( done ) => {
    expect.hasAssertions();

    process.env.SLACK_VERIFICATION_TOKEN = 'xxxxxxxxxxxxxxxxxxxxxxxx';
    const listener = require( pathToListener )();

    listener.on( 'listening', () => {
      http.request( config.defaultRequestOptions, ( response ) => {
        listener.close();
        expect( response.statusCode ).toBe( 500 );
        done();
      }).end();
    });

  });

  it( 'returns HTTP 403 when verification token is incorrect', ( done ) => {
    expect.hasAssertions();

    const listener = require( pathToListener )();
    const body = { token: 'something_is_not_right' };

    listener.on( 'listening', () => {

      const request = http.request( config.defaultRequestOptions, ( response ) => {
        listener.close();
        expect( response.statusCode ).toBe( 403 );
        done();
      });

      request.write( JSON.stringify( body ) );
      request.end();

    });
  });

  it( 'responds to Slack on retries and then drops the event', () => {
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
    expect( result ).toBeFalse();
    expect( mockExpress.response.send ).toHaveBeenCalledTimes( 1 );

  });

}); // Express Server tests.

/****************************************************************
 * Postgres tests.
 ****************************************************************/

describe( 'The database', () => {

  const tableExistsQuery = 'SELECT EXISTS ( ' +
    'SELECT 1 FROM information_schema.tables ' +
    'WHERE table_name = \'' + config.scoresTableName + '\'' +
  ')';

  const extensionExistsQuery = 'SELECT * FROM pg_extension WHERE extname = \'citext\'';

  it( 'does not yet have the ' + config.scoresTableName + ' table', async() => {
    expect.hasAssertions();
    const dbClient = await postgres.connect();
    const query = await dbClient.query( tableExistsQuery );
    await dbClient.release();
    expect( query.rows[0].exists ).toBeFalse();
  });

  it( 'does not yet have the case-insensitive extension', async() => {
    expect.hasAssertions();
    const dbClient = await postgres.connect();
    const query = await dbClient.query( extensionExistsQuery );
    await dbClient.release();
    expect( query.rowCount ).toBe( 0 );
  });

  /**
   * Provides a 'first request' and a test that it successfully creates the database table.
   *
   * @param {callable} done A callback to use for alerting Jest that the test is complete.
   * @return {void}
   */
  const doFirstRequest = ( done ) => {
    expect.hasAssertions();
    const listener = require( pathToListener )({ slack: slackClientMock });

    listener.on( 'listening', () => {
      runner( '@something++', async( dbClient ) => {
        listener.close();
        const query = await dbClient.query( tableExistsQuery );
        await dbClient.release();
        expect( query.rows[0].exists ).toBeTrue();
        done();
      });
    });
  };

  it( 'creates the ' + config.scoresTableName + ' table on the first request', doFirstRequest );

  it( 'also creates the case-insensitive extension on the first request', async() => {
    expect.hasAssertions();
    const dbClient = await postgres.connect();
    const query = await dbClient.query( extensionExistsQuery );
    await dbClient.release();
    expect( query.rowCount ).toBe( 1 );
  });

  it( 'does not cause errors on subsequent requests', doFirstRequest );

}); // Postgres tests.
