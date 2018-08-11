/**
 * End-to-end tests.
 *
 * @see https://jestjs.io/docs/en/expect
 * @author Tim Malone <tdmalone@gmail.com>
 */

'use strict';

const pg = require( 'pg' ),
      config = require( './_config' ),
      runner = require( './_runner' ),
      slackClientMock = require( './mocks/slack' );

let listener;
const postgres = new pg.Pool( config.postgresPoolConfig );

// Catch all console output during tests.
console.error = jest.fn();
console.info = jest.fn();
console.log = jest.fn();
console.warn = jest.fn();

// Clear the DB table + start the Express server before we begin.
beforeAll( async() => {

  const dbClient = await postgres.connect();
  await dbClient.query( 'DROP TABLE IF EXISTS ' + config.scoresTableName );
  dbClient.release();

  return new Promise( resolve => {
    listener = require( '../' )({ slack: slackClientMock });
    listener.on( 'listening', () => {
      resolve();
    });
  });
});

// Close the Express server when we end.
afterAll( () => {
  listener.close();
});

test( '++ works for brand new thing A and then equals 1', ( done ) => {
  expect.hasAssertions();
  runner( '@ThingA++', 'ThingA', ( result ) => {
    expect( result ).toBe( 1 );
    done();
  });
});

test( '-- works for brand new thing B and then equals -1', ( done ) => {
  expect.hasAssertions();
  runner( '@ThingB--', 'ThingB', ( result ) => {
    expect( result ).toBe( -1 );
    done();
  });
});

test( '++ works for existing thing A and then equals 2', ( done ) => {
  expect.hasAssertions();
  runner( '@ThingA++', 'ThingA', ( result ) => {
    expect( result ).toBe( 2 );
    done();
  });
});

test( '-- works for existing thing B and then equals -2', ( done ) => {
  expect.hasAssertions();
  runner( '@ThingB--', 'ThingB', ( result ) => {
    expect( result ).toBe( -2 );
    done();
  });
});

test( '++ works for existing thing A with different case and then equals 3', ( done ) => {
  expect.hasAssertions();
  runner( '@tHiNgA++', 'ThInGa', ( result ) => {
    expect( result ).toBe( 3 );
    done();
  });
});

test( '++ works for brand new user 100 and then equals 1', ( done ) => {
  expect.hasAssertions();
  runner( '<@U00000100>++', 'U00000100', ( result ) => {
    expect( result ).toBe( 1 );
    done();
  });
});

test( '-- works for brand new user 200 and then equals -1', ( done ) => {
  expect.hasAssertions();
  runner( '<@U00000200>--', 'U00000200', ( result ) => {
    expect( result ).toBe( -1 );
    done();
  });
});

test( '++ works for existing user 100 and then equals 2', ( done ) => {
  expect.hasAssertions();
  runner( '<@U00000100>++', 'U00000100', ( result ) => {
    expect( result ).toBe( 2 );
    done();
  });
});

test( '-- works for existing user 200 and then equals -2', ( done ) => {
  expect.assertions( 1 );
  runner( '<@U00000200>--', 'U00000200', ( result ) => {
    expect( result ).toBe( -2 );
    done();
  });
});

// TODO: Enable this test after implementing self user actions in the test runner.
test.skip( 'self ++ fails for existing user 100 and then still equals 2', ( done ) => {
  expect.assertions( 1 );
  runner( '<@U00000100>++', 'U00000100', ( result ) => {
    expect( result ).toBe( 2 );
    done();
  });
});

// TODO: Enable this test after implementing self user actions in the test runner.
test.skip( 'self -- works for existing user 200 and then equals -3', ( done ) => {
  expect.assertions( 1 );
  runner( '<@U00000200>--', 'U00000200', ( result ) => {
    expect( result ).toBe( -3 );
    done();
  });
});

test( '++ works for existing user 100 and then equals 3', ( done ) => {
  expect.assertions( 1 );
  runner( '<@U00000100>++', 'U00000100', ( result ) => {
    expect( result ).toBe( 3 );
    done();
  });
});

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
