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

// Mock the Slack mock, so we can use Jest expects on it.
slackClientMock.chat.postMessage = jest.fn( slackClientMock.chat.postMessage );

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

/****************************************************************
 * Postgres Tests.
 ****************************************************************/

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
  expect.hasAssertions();
  runner( '<@U00000200>--', 'U00000200', ( result ) => {
    expect( result ).toBe( -2 );
    done();
  });
});

test( 'self ++ fails for existing user 100 and then still equals 2', ( done ) => {
  expect.hasAssertions();
  const user = 'U00000100';

  runner( '<@' + user + '>++', user, ( result ) => {
    expect( result ).toBe( 2 );
    done();
  }, user );
});

test( 'self -- works for existing user 200 and then equals -3', ( done ) => {
  expect.hasAssertions();
  const user = 'U00000200';

  runner( '<@' + user + '>--', user, ( result ) => {
    expect( result ).toBe( -3 );
    done();
  }, user );
});

test( '++ works for existing user 100 and then equals 3', ( done ) => {
  expect.hasAssertions();
  const user = 'U00000100';

  runner( '<@' + user + '>++', user, ( result ) => {
    expect( result ).toBe( 3 );
    done();
  });
});

/****************************************************************
 * Slack Tests.
 ****************************************************************/

test( 'Message contains user 100 link after self++', ( done ) => {
  expect.assertions( 2 );
  const user = 'U00000100';

  slackClientMock.chat.postMessage.mockClear();
  runner( '<@' + user + '>++', () => {

    expect( slackClientMock.chat.postMessage )
      .toHaveBeenCalledTimes( 1 )
      .toHaveBeenCalledWith(
        expect.objectContaining({ text: expect.stringContaining( '<@' + user + '>' ) })
      );

    done();

  }, null, user );
});

test( 'Message contains user 100 link and score 4 after ++', ( done ) => {
  expect.assertions( 3 );
  const user = 'U00000100';

  slackClientMock.chat.postMessage.mockClear();
  runner( '<@' + user + '>++', () => {

    expect( slackClientMock.chat.postMessage )
      .toHaveBeenCalledTimes( 1 )
      .toHaveBeenCalledWith(
        expect.objectContaining({ text: expect.stringContaining( '<@' + user + '>' ) })
      )
      .toHaveBeenCalledWith(
        expect.objectContaining({ text: expect.stringMatching( /\s4\b/ ) })
      );

    done();

  });
});

test( 'Message contains user 200 link and score -4 after --', ( done ) => {
  expect.assertions( 3 );
  const user = 'U00000200';

  slackClientMock.chat.postMessage.mockClear();
  runner( '<@' + user + '>--', () => {

    expect( slackClientMock.chat.postMessage )
      .toHaveBeenCalledTimes( 1 )
      .toHaveBeenCalledWith(
        expect.objectContaining({ text: expect.stringContaining( '<@' + user + '>' ) })
      )
      .toHaveBeenCalledWith(
        expect.objectContaining({ text: expect.stringMatching( /\s-4\b/ ) })
      );

    done();

  });
});

test( 'Message contains singular \'point\' after thing E++ (i.e. score 1)', ( done ) => {
  expect.assertions( 2 );
  const thing = 'ThingE';

  slackClientMock.chat.postMessage.mockClear();
  runner( '@' + thing + '++', () => {

    expect( slackClientMock.chat.postMessage )
      .toHaveBeenCalledTimes( 1 )
      .toHaveBeenCalledWith(
        expect.objectContaining({ text: expect.stringMatching( /\spoint\b/ ) })
      );

    done();

  });
});

test( 'Message contains plural \'points\' after thing E++ (i.e. score 2)', ( done ) => {
  expect.assertions( 2 );
  const thing = 'ThingE';

  slackClientMock.chat.postMessage.mockClear();
  runner( '@' + thing + '++', () => {

    expect( slackClientMock.chat.postMessage )
      .toHaveBeenCalledTimes( 1 )
      .toHaveBeenCalledWith(
        expect.objectContaining({
          text: expect.stringMatching( /\spoints\b/ )
        })
      );

    done();

  });
});

test( 'Message contains singular \'point\' after thing F-- (i.e. score -1)', ( done ) => {
  expect.hasAssertions();
  const thing = 'ThingF';

  slackClientMock.chat.postMessage.mockClear();
  runner( '@' + thing + '--', () => {

    expect( slackClientMock.chat.postMessage )
      .toHaveBeenCalledTimes( 1 )
      .toHaveBeenCalledWith(
        expect.objectContaining({
          text: expect.stringMatching( /\spoint\b/ )
        })
      );

    done();

  });
});

test( 'Message contains plural \'points\' after thing F-- (i.e. score -2)', ( done ) => {
  expect.hasAssertions();
  const thing = 'ThingF';

  slackClientMock.chat.postMessage.mockClear();
  runner( '@' + thing + '--', () => {

    expect( slackClientMock.chat.postMessage )
      .toHaveBeenCalledTimes( 1 )
      .toHaveBeenCalledWith(
        expect.objectContaining({
          text: expect.stringMatching( /\spoints\b/ )
        })
      );

    done();

  });
});

test( 'Message contains plural \'points\' after thing G ++ then -- (i.e. score 0)', ( done ) => {
  expect.hasAssertions();
  const thing = 'ThingG';

  slackClientMock.chat.postMessage.mockClear();
  runner( '@' + thing + '++', () => {
    runner( '@' + thing + '--', () => {
      expect( slackClientMock.chat.postMessage )
        .toHaveBeenCalledTimes( 2 )
        .toHaveBeenNthCalledWith(
          2,
          expect.objectContaining({
            text: expect.stringMatching( /\spoints\b/ )
          })
        );

      done();
    });
  });
});

// TODO: Test Message contains <@ and > after user 300 ++.
// TODO: Test Slack message does not contain <@ and > after 'thing' 400 ++.

// TODO: Test Slack message can be found in 'plus' messages after user 300 ++.
// TODO: Test Slack message can be found in 'minus' messages after user 300 --.
// TODO: Test Slack message can be found in 'selfPlus' messages after self++.

// TODO: Test Slack messages go back to the channel they were sent from.
// TODO: Test that user messages still work with a space before the ++.
// TODO: Test that thing messages still work with a space before the ++.
