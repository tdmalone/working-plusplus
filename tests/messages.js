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

  it( 'throws an error for an invalid operation', () => {
    expect( () => {
      messages.getRandomMessage( 'INVALID_OPERATION', 'RandomThing' );
    }).toThrow();
  });

  it( 'throws an error if a suitable set cannot be found', () => {

  });

}); // GetRandomMessage.
