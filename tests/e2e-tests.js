/**
 * End-to-end tests.
 *
 * @see https://jestjs.io/docs/en/expect
 * @see https://github.com/jest-community/jest-extended#api
 * @author Tim Malone <tdmalone@gmail.com>
 */

/* global jest */

'use strict';

/****************************************************************
 * Environment Configuration.
 ****************************************************************/

const pg = require( 'pg' ),
      config = require( './_config' ),
      runner = require( './_runner' ),
      messages = require( '../src/messages' ),
      slackClientMock = require( './mocks/slack' );

let listener;
const postgres = new pg.Pool( config.postgresPoolConfig );

/****************************************************************
 * Jest Setup.
 ****************************************************************/

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
  await dbClient.release();

  return new Promise( ( resolve ) => {
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
 * Database tests.
 ****************************************************************/

describe( 'The database', () => {

  const thingTable = [
    [ '++', 'new     ', 'ThingA', 1 ],
    [ '++', 'existing', 'ThingA', 2 ],
    [ '--', 'new     ', 'ThingB', -1 ],
    [ '--', 'existing', 'ThingB', -2 ]
  ];

  const userTable = [
    [ '++', 'new     ', 'U00000100', 1 ],
    [ '++', 'existing', 'U00000100', 2 ],
    [ '--', 'new     ', 'U00000200', -1 ],
    [ '--', 'existing', 'U00000200', -2 ]
  ];

  it.each( thingTable )(
    'stores a %s for a %s thing (%s) and returns a score of %d',
    ( operation, description, thing, score, done ) => {
      expect.hasAssertions();
      runner( '@' + thing + operation, { itemToCheck: thing }, ( result ) => {
        expect( result ).toBe( score );
        done();
      });
    }
  );

  it.each( userTable )(
    'stores a %s for a %s user (%s) and returns a score of %d',
    ( operation, description, user, score, done ) => {
      expect.hasAssertions();
      runner( '<@' + user + '>' + operation, { itemToCheck: user }, ( result ) => {
        expect( result ).toBe( score );
        done();
      });
    }
  );

  it( 'stores a ++ for ThInGa in a different case and returns a score of 3', ( done ) => {
    expect.hasAssertions();
    runner( '@tHiNgA++', { itemToCheck: 'ThInGa' }, ( result ) => {
      expect( result ).toBe( 3 );
      done();
    });
  });

  it( 'refuses a self ++ for an existing user (100) and still returns a score of 2', ( done ) => {
    expect.hasAssertions();

    const user = 'U00000100';
    const options = {
      itemToCheck: user,
      extraBody: { event: { user } }
    };

    runner( '<@' + user + '>++', options, ( result ) => {
      expect( result ).toBe( 2 );
      done();
    });
  });

  it( 'refuses a self ++ for a new user (300) and has no score to retrieve', ( done ) => {
    expect.hasAssertions();

    const user = 'U00000300',
          options = {
            itemToCheck: user,
            extraBody: { event: { user } }
          };

    runner( '<@' + user + '>++', options, ( result ) => {
      expect( result ).toBeFalse();
      done();
    });
  });

  it( 'allows a self -- for an existing user (200) and returns a score of -3', ( done ) => {
    expect.hasAssertions();

    const user = 'U00000200',
          options = {
            itemToCheck: user,
            extraBody: { event: { user } }
          };

    runner( '<@' + user + '>--', options, ( result ) => {
      expect( result ).toBe( -3 );
      done();
    });
  });

  it( 'allows a self -- for a new user (400) and returns a score of -1', ( done ) => {
    expect.hasAssertions();

    const user = 'U00000400',
          options = {
            itemToCheck: user,
            extraBody: { event: { user } }
          };

    runner( '<@' + user + '>--', options, ( result ) => {
      expect( result ).toBe( -1 );
      done();
    });
  });

  it( 'stores another ++ for an existing user (100) and then equals 3', ( done ) => {
    expect.hasAssertions();
    const user = 'U00000100';

    runner( '<@' + user + '>++', { itemToCheck: user }, ( result ) => {
      expect( result ).toBe( 3 );
      done();
    });
  });

}); // Database tests.

/****************************************************************
 * Slack message tests.
 ****************************************************************/

describe( 'Slack messaging', () => {

  it( 'does not link to a \'thing\'', ( done ) => {
    expect.hasAssertions();
    const thing = 'SomeRandomThing';

    slackClientMock.chat.postMessage.mockClear();
    runner( '@' + thing + '++', () => {

      expect( slackClientMock.chat.postMessage )
        .toHaveBeenCalledTimes( 1 )
        .toHaveBeenCalledWith(
          expect.objectContaining({ text: expect.stringContaining( thing ) })
        )
        .toHaveBeenCalledWith(
          expect.objectContaining({ text: expect.not.stringContaining( '<@' + thing + '>' ) })
        );

      done();

    });
  });

  it( 'contains a user\'s link (user 100) after a self ++', ( done ) => {
    expect.hasAssertions();
    const user = 'U00000100',
          options = {
            extraBody: { event: { user } }
          };

    slackClientMock.chat.postMessage.mockClear();
    runner( '<@' + user + '>++', options, () => {

      expect( slackClientMock.chat.postMessage )
        .toHaveBeenCalledTimes( 1 )
        .toHaveBeenCalledWith(
          expect.objectContaining({ text: expect.stringContaining( '<@' + user + '>' ) })
        );

      done();

    });
  });

  const userTable = [
    [ 'U00000100', 4, '++' ],
    [ 'U00000200', -4, '--' ]
  ];

  it.each( userTable )(
    'contains a user\'s link (%s) and a score of %d after another %s',
    ( user, score, operation, done ) => {
      expect.hasAssertions();
      const scoreRegExp = new RegExp( '\\s' + score + '\\b' );

      slackClientMock.chat.postMessage.mockClear();
      runner( '<@' + user + '>' + operation, () => {

        expect( slackClientMock.chat.postMessage )
          .toHaveBeenCalledTimes( 1 )
          .toHaveBeenCalledWith(
            expect.objectContaining({ text: expect.stringContaining( '<@' + user + '>' ) })
          )
          .toHaveBeenCalledWith(
            expect.objectContaining({ text: expect.stringMatching( scoreRegExp ) })
          );

        done();

      });
    });

  const thingTable = [
    [ 'point', '++', 'ThingC', 1 ],
    [ 'points', '++', 'ThingC', 2 ],
    [ 'point', '--', 'ThingD', 1 ],
    [ 'points', '--', 'ThingD', 2 ]
  ];

  it.each( thingTable )(
    'contains \'%s\' after a %s for %s (i.e. score %d)',
    ( word, operation, thing, sampleScore, done ) => {
      expect.hasAssertions();
      const wordRegExp = new RegExp( '\\s' + word + '\\b' );

      slackClientMock.chat.postMessage.mockClear();
      runner( '@' + thing + operation, () => {

        expect( slackClientMock.chat.postMessage )
          .toHaveBeenCalledTimes( 1 )
          .toHaveBeenCalledWith(
            expect.objectContaining({ text: expect.stringMatching( wordRegExp ) })
          );

        done();

      });
    });

  it( 'contains the plural \'points\' for a score of 0 (ThingE++ then --)', ( done ) => {
    expect.hasAssertions();
    const thing = 'ThingE';

    slackClientMock.chat.postMessage.mockClear();
    runner( '@' + thing + '++', () => {
      runner( '@' + thing + '--', () => {
        expect( slackClientMock.chat.postMessage )
          .toHaveBeenCalledTimes( 2 )
          .toHaveBeenNthCalledWith(
            2,
            expect.objectContaining({ text: expect.stringMatching( /\spoints\b/ ) })
          );

        done();
      });
    });
  });

  const operationsTable = [
    [ 'plus', '++', {} ],
    [ 'minus', '--', {} ],
    [ 'selfPlus', '++', { event: { user: 'U12345678' } } ]
  ];

  it.each( operationsTable )(
    'sends a message from the %s collection for a %s',
    ( name, operation, extraData, done ) => {
      expect.hasAssertions();
      slackClientMock.chat.postMessage.mockClear();

      const messageText = '<@U12345678>' + operation,
            options = { extraBody: extraData };

      runner( messageText, options, async() => {

        const postMessageCall = slackClientMock.chat.postMessage.mock.calls[0],
              payload = postMessageCall[0],
              collection = messages.messages[ name ];

        let messageFoundInCollection = false;

        outerLoop:
        for ( const set of collection ) {
          for ( const message of set.set ) {
            if ( -1 !== payload.text.indexOf( message ) ) {
              messageFoundInCollection = true;
              break outerLoop;
            }
          }
        }

        expect( slackClientMock.chat.postMessage ).toHaveBeenCalledTimes( 1 );
        expect( messageFoundInCollection ).toBeTrue();

        done();

      });
    });

  it( 'sends messages back to the channel they were sent from', ( done ) => {
    expect.hasAssertions();

    const channel = 'C00000000',
          options = { extraBody: { event: { channel } } };

    slackClientMock.chat.postMessage.mockClear();
    runner( '@SomeRandom++', options, () => {

      expect( slackClientMock.chat.postMessage )
        .toHaveBeenCalledTimes( 1 )
        .toHaveBeenCalledWith( expect.objectContaining({ channel }) );

      done();

    });
  });

}); // Slack message tests.
