/**
 * Unit tests on the helpers in helpers.js.
 *
 * @see https://jestjs.io/docs/en/expect
 * @author Tim Malone <tdmalone@gmail.com>
 */

/* global jest */

'use strict';

const helpers = require( '../src/helpers' );

describe( 'extractEventData', () => {

  it( 'drops message without an @ symbol', () => {
    expect( helpers.extractEventData( 'Hello++' ) ).toBeFalse();
  });

  it( 'drops messages without a valid operation', () => {
    expect( helpers.extractEventData( '@Hello' ) ).toBeFalse();
  });

  it( 'drops messages without a valid user/item', () => {
    expect( helpers.extractEventData( '@++' ) ).toBeFalse();
  });

  it( 'extracts a \'thing\' and operation from the start of a message', () => {
    expect( helpers.extractEventData( '@SomethingRandom++ that was awesome' ) ).toEqual({
      item: 'SomethingRandom',
      operation: '+'
    });
  });

  it( 'extracts a user and operation from the start of a message', () => {
    expect( helpers.extractEventData( '<@U87654321>++ that was awesome' ) ).toEqual({
      item: 'U87654321',
      operation: '+'
    });
  });

  it( 'extracts data in the middle of a message', () => {
    expect( helpers.extractEventData( 'Hey @SomethingRandom++ that was awesome' ) ).toEqual({
      item: 'SomethingRandom',
      operation: '+'
    });
  });

  it( 'extracts data at the end of a message', () => {
    expect( helpers.extractEventData( 'Awesome work @SomethingRandom++' ) ).toEqual({
      item: 'SomethingRandom',
      operation: '+'
    });
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
          const result = helpers.extractEventData( messageText );
          expect( result ).toEqual({
            item: item.expected,
            operation: operation.expected
          });
        });

      } // For iterator.
    } // For operationsToMatch.

    for ( const operation of operationsNotToMatch ) {
      const messageText = item.supplied + operation;
      it( 'does NOT match ' + messageText, () => {
        expect( helpers.extractEventData( messageText ) ).toBeFalse();
      });
    }

  } // For itemsToMatch.
}); // ExtractEventData.

describe( 'maybeLinkItem', () => {

  it( 'returns an item as-is if it is not a Slack user ID', () => {
    const item = 'something';
    expect( helpers.maybeLinkItem( item ) ).toBe( item );
  });

  it( 'returns an item linked with Slack mrkdown if it looks like a Slack user ID', () => {
    const item = 'U12345678';
    expect( helpers.maybeLinkItem( item ) ).toBe( '<@' + item + '>' );
  });

}); // MaybeLinkItem.
