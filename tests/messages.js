/**
 * Unit tests on the messages.js file.
 *
 * TODO: Expand tests.
 *
 * @see https://jestjs.io/docs/en/expect
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

for ( const operation of operations ) {
  it( 'returns a message for the ' + operation + ' operation', () => {
    expect( typeof messages.getRandomMessage( operation ) ).toBe( 'string' );
  });
}

it( 'throws an error for an invalid operation', () => {
  expect( () => {
    messages.getRandomMessage( 'INVALID_OPERATION' );
  }).toThrow();
});
