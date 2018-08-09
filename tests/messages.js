/**
 * Unit tests on the messages.js file.
 *
 * @see https://jestjs.io/docs/en/expect
 * @author Tim Malone <tdmalone@gmail.com>
 */

'use strict';

const messages = require( '../src/messages' );

const operations = [
  'plus',
  'minus',
  'selfPlus'
];
let op;

for ( op of operations ) {
  test( 'A message is returned for the ' + op + ' operation', () => {
    expect( typeof messages.getRandomMessage( op ) ).toBe( 'string' );
  });
}

test( 'An error occurs for an invalid operation', () => {
  expect( () => {
    messages.getRandomMessage( 'INVALID_OPERATION' );
  }).toThrow();
});
