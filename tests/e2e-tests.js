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
      messages = require( '../src/messages' ),
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
  await dbClient.release();

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
  runner( '@ThingA++', { itemToCheck: 'ThingA' }, ( result ) => {
    expect( result ).toBe( 1 );
    done();
  });
});

test( '-- works for brand new thing B and then equals -1', ( done ) => {
  expect.hasAssertions();
  runner( '@ThingB--', { itemToCheck: 'ThingB' }, ( result ) => {
    expect( result ).toBe( -1 );
    done();
  });
});

test( '++ works for existing thing A and then equals 2', ( done ) => {
  expect.hasAssertions();
  runner( '@ThingA++', { itemToCheck: 'ThingA' }, ( result ) => {
    expect( result ).toBe( 2 );
    done();
  });
});

test( '-- works for existing thing B and then equals -2', ( done ) => {
  expect.hasAssertions();
  runner( '@ThingB--', { itemToCheck: 'ThingB' }, ( result ) => {
    expect( result ).toBe( -2 );
    done();
  });
});

test( '++ works for existing thing A with different case and then equals 3', ( done ) => {
  expect.hasAssertions();
  runner( '@tHiNgA++', { itemToCheck: 'ThInGa' }, ( result ) => {
    expect( result ).toBe( 3 );
    done();
  });
});

test( '++ works for brand new user 100 and then equals 1', ( done ) => {
  expect.hasAssertions();
  runner( '<@U00000100>++', { itemToCheck: 'U00000100' }, ( result ) => {
    expect( result ).toBe( 1 );
    done();
  });
});

test( '-- works for brand new user 200 and then equals -1', ( done ) => {
  expect.hasAssertions();
  runner( '<@U00000200>--', { itemToCheck: 'U00000200' }, ( result ) => {
    expect( result ).toBe( -1 );
    done();
  });
});

test( '++ works for existing user 100 and then equals 2', ( done ) => {
  expect.hasAssertions();
  runner( '<@U00000100>++', { itemToCheck: 'U00000100' }, ( result ) => {
    expect( result ).toBe( 2 );
    done();
  });
});

test( '-- works for existing user 200 and then equals -2', ( done ) => {
  expect.hasAssertions();
  runner( '<@U00000200>--', { itemToCheck: 'U00000200' }, ( result ) => {
    expect( result ).toBe( -2 );
    done();
  });
});

test( 'self ++ fails for existing user 100 and then still equals 2', ( done ) => {
  expect.hasAssertions();

  const user = 'U00000100',
        options = {
          itemToCheck: user,
          extraBody: { event: { user: user } }
        };

  runner( '<@' + user + '>++', options, ( result ) => {
    expect( result ).toBe( 2 );
    done();
  });
});

test( 'self -- works for existing user 200 and then equals -3', ( done ) => {
  expect.hasAssertions();

  const user = 'U00000200',
        options = {
          itemToCheck: user,
          extraBody: { event: { user: user } }
        };

  runner( '<@' + user + '>--', options, ( result ) => {
    expect( result ).toBe( -3 );
    done();
  });
});

test( '++ works for existing user 100 and then equals 3', ( done ) => {
  expect.hasAssertions();
  const user = 'U00000100';

  runner( '<@' + user + '>++', { itemToCheck: user }, ( result ) => {
    expect( result ).toBe( 3 );
    done();
  });
});

/****************************************************************
 * Slack Tests.
 ****************************************************************/

test( 'Message contains user 100 link after self++', ( done ) => {
  expect.hasAssertions();
  const user = 'U00000100',
        options = {
          extraBody: { event: { user: user } }
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

test( 'Message contains user 100 link and score 4 after ++', ( done ) => {
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

test( 'Message contains user 200 link and score -4 after --', ( done ) => {
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

test( 'Message contains singular \'point\' after thing C++ (i.e. score 1)', ( done ) => {
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

test( 'Message contains plural \'points\' after thing C++ (i.e. score 2)', ( done ) => {
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

test( 'Message contains singular \'point\' after thing D-- (i.e. score -1)', ( done ) => {
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

test( 'Message contains plural \'points\' after thing D-- (i.e. score -2)', ( done ) => {
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

test( 'Message contains plural \'points\' after thing E++ then -- (i.e. score 0)', ( done ) => {
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

test( 'Slack message does not link to a thing', ( done ) => {
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
    operation.operation + ' message can be found in ' +
    operation.name + ' collection'
  );

  test( testName, ( done ) => {
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

test( 'Slack messages go back to the channel they were sent from', ( done ) => {
  expect.hasAssertions();

  const channel = 'C00000000',
        options = { extraBody: { event: { channel: channel } } };

  slackClientMock.chat.postMessage.mockClear();
  runner( '@SomeRandom++', options, () => {

    expect( slackClientMock.chat.postMessage )
      .toHaveBeenCalledTimes( 1 )
      .toHaveBeenCalledWith( expect.objectContaining({ channel: channel }) );

    done();

  });
});
