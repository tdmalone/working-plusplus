/**
 * Unit tests on the helpers in helpers.js.
 *
 * @see https://jestjs.io/docs/en/expect
 * @see https://github.com/jest-community/jest-extended#api
 * @author Tim Malone <tdmalone@gmail.com>
 */

/* global jest */

'use strict';

const helpers = require( '../src/helpers' );

const MILLISECONDS_TO_SECONDS = 1000;

describe( 'extractCommand', () => {

  const commands = [
    'test-command',
    'something-else',
    'another-command'
  ];

  it( 'returns a valid command from a message containing only that command', () => {
    const message = '<@U12345678> test-command';
    expect( helpers.extractCommand( message, commands ) ).toEqual( 'test-command' );
  });

  it( 'returns a valid command from the start of a message', () => {
    const message = '<@U12345678> test-command would be great';
    expect( helpers.extractCommand( message, commands ) ).toEqual( 'test-command' );
  });

  it( 'returns a valid command from the middle of a message', () => {
    const message = '<@U12345678> can I have a test-command please';
    expect( helpers.extractCommand( message, commands ) ).toEqual( 'test-command' );
  });

  it( 'returns a valid command from the end of a message', () => {
    const message = '<@U12345678> I would love to see a test-command';
    expect( helpers.extractCommand( message, commands ) ).toEqual( 'test-command' );
  });

  it( 'returns the first valid command in a message with multiple', () => {
    const message = '<@U12345678> looking for something-else rather than a test-command';
    expect( helpers.extractCommand( message, commands ) ).toEqual( 'something-else' );
  });

  it( 'returns the first valid command in a message with multiple (with order switched)', () => {
    const message = '<@U12345678> looking for a test-command rather than something-else';
    expect( helpers.extractCommand( message, commands ) ).toEqual( 'test-command' );
  });

  it( 'returns false if it cannot find a valid command in a message', () => {
    const message = '<@U12345678> there is nothing actionable here';
    expect( helpers.extractCommand( message, commands ) ).toBeFalse();
  });

});

describe( 'extractPlusMinusEventData', () => {

  it( 'drops message without an @ symbol', () => {
    expect( helpers.extractPlusMinusEventData( 'Hello++' ) ).toBeFalse();
  });

  it( 'drops messages without a valid operation', () => {
    expect( helpers.extractPlusMinusEventData( '@Hello' ) ).toBeFalse();
  });

  it( 'drops messages without a valid user/item', () => {
    expect( helpers.extractPlusMinusEventData( '@++' ) ).toBeFalse();
  });

  it( 'extracts a \'thing\' and operation from the start of a message', () => {
    expect( helpers.extractPlusMinusEventData( '@SomethingRandom++ that was awesome' ) ).toEqual([
      {
        item: 'SomethingRandom',
        operation: '+'
      }
    ]);
  });

  it( 'extracts a user and operation from the start of a message', () => {
    expect( helpers.extractPlusMinusEventData( '<@U87654321>++ that was awesome' ) ).toEqual([
      {
        item: 'U87654321',
        operation: '+'
      }
    ]);
  });

  it( 'extracts data in the middle of a message', () => {
    expect( helpers.extractPlusMinusEventData( 'Hey @SomethingRandom++ you\'re great' ) ).toEqual([
      {
        item: 'SomethingRandom',
        operation: '+'
      }
    ]);
  });

  it( 'extracts data at the end of a message', () => {
    expect( helpers.extractPlusMinusEventData( 'Awesome work @SomethingRandom++' ) ).toEqual([
      {
        item: 'SomethingRandom',
        operation: '+'
      }
    ]);
  });

  it( 'extracts multiple mentions in one message', () => {
    const multiMentions = 'Thing one @SomethingRandom++ and thing two @SomethingElse--';
    expect( helpers.extractPlusMinusEventData( multiMentions ) ).toEqual([
      {
        item: 'SomethingRandom',
        operation: '+'
      },
      {
        item: 'SomethingElse',
        operation: '-'
      }
    ]);
  });

  const itemsToMatch = [
    {
      supplied: '<@U1234567890>',
      expected: 'U1234567890'
    },
    {
      supplied: '@SomethingRandom',
      expected: 'SomethingRandom'
    },
    {
      supplied: '@SomethingRandom123',
      expected: 'SomethingRandom123'
    }
  ];

  const operationsToMatch = [
    {
      supplied: '++',
      expected: '+'
    },
    {
      supplied: '--',
      expected: '-'
    },
    {
      supplied: '—', // Emdash, which iOS replaces -- with.
      expected: '-'
    }
  ];

  const operationsNotToMatch = [
    '+',
    '-'
  ];

  for ( const item of itemsToMatch ) {

    for ( const operation of operationsToMatch ) {
      for ( let iterator = 0; 1 >= iterator; iterator++ ) {

        const space = 1 === iterator ? ' ' : '',
              messageText = item.supplied + space + operation.supplied,
              testName = (
                'matches ' + messageText + ' as ' + item.expected + ' and ' + operation.expected
              );

        it( testName, () => {
          const result = helpers.extractPlusMinusEventData( messageText );
          expect( result ).toEqual([
            {
              item: item.expected,
              operation: operation.expected
            }
          ]);
        });

      } // For iterator.
    } // For operationsToMatch.

    for ( const operation of operationsNotToMatch ) {
      const messageText = item.supplied + operation;
      it( 'does NOT match ' + messageText, () => {
        expect( helpers.extractPlusMinusEventData( messageText ) ).toBeFalse();
      });
    }

  } // For itemsToMatch.
}); // ExtractPlusMinusEventData.

describe( 'getTimeBasedToken', () => {

  it( 'returns a string', () => {
    expect( helpers.getTimeBasedToken( helpers.getTimestamp() ) ).toBeString();
  });

  it( 'throws if a timestamp is not provided', () => {
    expect( () => {
      helpers.getTimeBasedToken();
    }).toThrow();
  });

  it( 'provides a different token if called with a different timestamp', () => {
    const token1 = helpers.getTimeBasedToken( 123456789 );
    const token2 = helpers.getTimeBasedToken( 123123123 );
    expect( token1 ).not.toEqual( token2 );
  });

});

describe( 'getTimestamp', () => {

  it( 'returns an integer', () => {
    expect( helpers.getTimestamp() )
      .toBeNumber()
      .not.toBeString();
  });

  it( 'returns the current unix epoch', () => {
    const now = Math.floor( Date.now() / MILLISECONDS_TO_SECONDS );
    expect( helpers.getTimestamp() ).toBeWithin( now - 5, now + 1 );
  });

});

describe( 'isPlural', () => {

  const table = [
    [ true, -11 ],
    [ true, -2 ],
    [ false, -1 ],
    [ true, 0 ],
    [ false, 1 ],
    [ true, 2 ],
    [ true, 11 ]
  ];

  it.each( table )( 'returns %p for %d', ( result, number ) => {
    expect( helpers.isPlural( number ) ).toBe( result );
  });

});

describe( 'isTimeBasedTokenStillValid', () => {

  it( 'returns true for a token created just now', () => {
    const now = helpers.getTimestamp(),
          token = helpers.getTimeBasedToken( now );

    expect( helpers.isTimeBasedTokenStillValid( token, now ) ).toBeTrue();
  });

  it( 'returns true for a token created an hour ago', () => {
    const now = helpers.getTimestamp(),
          oneHourAgo = now - 60 * 60,
          token = helpers.getTimeBasedToken( oneHourAgo );

    expect( helpers.isTimeBasedTokenStillValid( token, oneHourAgo ) ).toBeTrue();
  });

  it( 'returns false for a token created with a different timestamp', () => {
    const now = helpers.getTimestamp(),
          token = helpers.getTimeBasedToken( now - 1 );

    expect( helpers.isTimeBasedTokenStillValid( token, now ) ).toBeFalse();
  });

  it( 'returns false for a token created in the future', () => {
    const now = helpers.getTimestamp(),
          theFuture = now + 10,
          token = helpers.getTimeBasedToken( theFuture );

    expect( helpers.isTimeBasedTokenStillValid( token, theFuture ) ).toBeFalse();
  });

  it( 'returns false for a token created two days ago', () => {
    const now = helpers.getTimestamp(),
          twoDaysAgo = now - 60 * 60 * 24 * 2,
          token = helpers.getTimeBasedToken( twoDaysAgo );

    expect( helpers.isTimeBasedTokenStillValid( token, twoDaysAgo ) ).toBeFalse();
  });

}); // IsTimeBasedTokenStillValid.

describe( 'isUser', () => {

  it( 'returns true for a Slack user ID', () => {
    expect( helpers.isUser( 'U00000000' ) ).toBeTrue();
  });

  it( 'returns false for something other than a Slack user ID', () => {
    expect( helpers.isUser( 'SomethingRandom' ) ).toBeFalse();
  });

});

describe( 'maybeLinkItem', () => {

  it( 'returns an item as-is if it is not a Slack user ID', () => {
    const item = 'something';
    expect( helpers.maybeLinkItem( item ) ).toBe( item );
  });

  it( 'returns an item linked with Slack mrkdwn if it looks like a Slack user ID', () => {
    const item = 'U12345678';
    expect( helpers.maybeLinkItem( item ) ).toBe( '<@' + item + '>' );
  });

}); // MaybeLinkItem.
