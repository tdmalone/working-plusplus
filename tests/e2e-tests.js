/**
 * End-to-end tests.
 *
 * @see https://jestjs.io/docs/en/expect
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

  it( 'stores a ++ for a new \'thing\' (ThingA) and returns a score of 1', ( done ) => {
    expect.hasAssertions();
    runner( '@ThingA++', { itemToCheck: 'ThingA' }, ( result ) => {
      expect( result ).toBe( 1 );
      done();
    });
  });

  it( 'stores a -- for a new \'thing\' (ThingB) and returns a score of -1', ( done ) => {
    expect.hasAssertions();
    runner( '@ThingB--', { itemToCheck: 'ThingB' }, ( result ) => {
      expect( result ).toBe( -1 );
      done();
    });
  });

  it( 'stores a ++ for an existing \'thing\' (ThingA) and returns a score of 2', ( done ) => {
    expect.hasAssertions();
    runner( '@ThingA++', { itemToCheck: 'ThingA' }, ( result ) => {
      expect( result ).toBe( 2 );
      done();
    });
  });

  it( 'stores a -- for an existing \'thing\' (ThingB) and returns a score of -2', ( done ) => {
    expect.hasAssertions();
    runner( '@ThingB--', { itemToCheck: 'ThingB' }, ( result ) => {
      expect( result ).toBe( -2 );
      done();
    });
  });

  it( 'stores a ++ for ThInGa in a different case and returns a score of 3', ( done ) => {
    expect.hasAssertions();
    runner( '@tHiNgA++', { itemToCheck: 'ThInGa' }, ( result ) => {
      expect( result ).toBe( 3 );
      done();
    });
  });

  it( 'stores a ++ for a new user (100) and returns a score of 1', ( done ) => {
    expect.hasAssertions();
    runner( '<@U00000100>++', { itemToCheck: 'U00000100' }, ( result ) => {
      expect( result ).toBe( 1 );
      done();
    });
  });

  it( 'stores a -- for a new user (200) and returns a score of -1', ( done ) => {
    expect.hasAssertions();
    runner( '<@U00000200>--', { itemToCheck: 'U00000200' }, ( result ) => {
      expect( result ).toBe( -1 );
      done();
    });
  });

  it( 'stores a ++ for an existing user (100) and returns a score of 2', ( done ) => {
    expect.hasAssertions();
    runner( '<@U00000100>++', { itemToCheck: 'U00000100' }, ( result ) => {
      expect( result ).toBe( 2 );
      done();
    });
  });

  it( 'stores a -- for an existing user (200) and returns a score of -2', ( done ) => {
    expect.hasAssertions();
    runner( '<@U00000200>--', { itemToCheck: 'U00000200' }, ( result ) => {
      expect( result ).toBe( -2 );
      done();
    });
  });

  it( 'refuses a self ++ for an existing user (100) and still returns a score of 2', ( done ) => {
    expect.hasAssertions();

    const user = 'U00000100',
          options = {
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
      expect( result ).toBe( false );
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

  it( 'contains a user\'s link (user 100) and a score of 4 after another ++', ( done ) => {
    expect.hasAssertions();
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

  it( 'contains a user\'s link (user 200) and a score of -4 after another --', ( done ) => {
    expect.hasAssertions();
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

  it( 'contains the singular \'point\' after a ++ for new ThingC (i.e. score 1)', ( done ) => {
    expect.hasAssertions();
    const thing = 'ThingC';

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

  it( 'contains the plural \'points\' after another ++ for ThingC (i.e. score 2)', ( done ) => {
    expect.hasAssertions();
    const thing = 'ThingC';

    slackClientMock.chat.postMessage.mockClear();
    runner( '@' + thing + '++', () => {

      expect( slackClientMock.chat.postMessage )
        .toHaveBeenCalledTimes( 1 )
        .toHaveBeenCalledWith(
          expect.objectContaining({ text: expect.stringMatching( /\spoints\b/ ) })
        );

      done();

    });
  });

  it( 'contains the singular \'point\' after a -- for new ThingD (i.e. score -1)', ( done ) => {
    expect.hasAssertions();
    const thing = 'ThingD';

    slackClientMock.chat.postMessage.mockClear();
    runner( '@' + thing + '--', () => {

      expect( slackClientMock.chat.postMessage )
        .toHaveBeenCalledTimes( 1 )
        .toHaveBeenCalledWith(
          expect.objectContaining({ text: expect.stringMatching( /\spoint\b/ ) })
        );

      done();

    });
  });

  it( 'contains the plural \'points\' after another -- for ThingD (i.e. score -2)', ( done ) => {
    expect.hasAssertions();
    const thing = 'ThingD';

    slackClientMock.chat.postMessage.mockClear();
    runner( '@' + thing + '--', () => {

      expect( slackClientMock.chat.postMessage )
        .toHaveBeenCalledTimes( 1 )
        .toHaveBeenCalledWith(
          expect.objectContaining({ text: expect.stringMatching( /\spoints\b/ ) })
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

  const operations = [
    {
      name: 'plus',
      operation: '++',
      extraData: {}
    },
    {
      name: 'minus',
      operation: '--',
      extraData: {}
    },
    {
      name: 'selfPlus',
      operation: '++',
      extraData: { event: { user: 'U12345678' } }
    }
  ];

  for ( const operation of operations ) {

    const testName = (
      'sends a message from the ' + operation.name + ' collection for a ' + operation.operation
    );

    it( testName, ( done ) => {
      expect.hasAssertions();
      slackClientMock.chat.postMessage.mockClear();

      const messageText = '<@U12345678>' + operation.operation,
            options = { extraBody: operation.extraData };

      runner( messageText, options, async() => {

        const postMessageCall = slackClientMock.chat.postMessage.mock.calls[0],
              payload = postMessageCall[0],
              collection = messages.messages[ operation.name ];

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
        expect( messageFoundInCollection ).toBe( true );

        done();

      });
    });

  } // For operation.

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
