/**
 * Unit tests on the messages.js file.
 *
 * TODO: Expand tests.
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

let operation;

for ( operation of operations ) {
  test( 'A message is returned for the ' + operation + ' operation', () => {
    expect( typeof messages.getRandomMessage( operation ) ).toBe( 'string' );
  });
}

test( 'An error occurs for an invalid operation', () => {
  expect( () => {
    messages.getRandomMessage( 'INVALID_OPERATION' );
  }).toThrow();
});
