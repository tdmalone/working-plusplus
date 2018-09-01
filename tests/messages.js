/**
 * Unit tests on the messages.js file.
 *
 * TODO: Expand tests.
 *
 * @see https://jestjs.io/docs/en/expect
 * @see https://github.com/jest-community/jest-extended#api
 * @author Tim Malone <tdmalone@gmail.com>
 */

/* global jest */

'use strict';

const messages = require( '../src/messages' );

const operations = [
  'plus',
  'minus',
  'selfPlus'
];

describe( 'getRandomMessage', () => {

  it.each( operations )( 'returns a message for the %s operation', ( operation ) => {
    expect( typeof messages.getRandomMessage( operation, 'RandomThing' ) ).toBe( 'string' );
  });

  it( 'throws \'invalid operation\' if an invalid operation is provided', () => {
    expect( () => {
      messages.getRandomMessage( 'some-operation', 'RandomThing' );
    }).toThrow( /invalid operation/i );
  });

  // TODO: Add test for 'could not find set' / 'ran out of sets' throw.

}); // GetRandomMessage.
