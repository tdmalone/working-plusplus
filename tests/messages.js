/**
 * Unit tests on the messages.js file.
 *
 * @see https://jestjs.io/docs/en/expect
 * @author Tim Malone <tdmalone@gmail.com>
 */

'use strict';

const messages = require( '../src/messages' );

test( 'A message is returned for the plus operation', () => {
  expect( typeof messages.getRandomMessage( 'plus' ) ).toBe( 'string' );
});

test( 'A message is returned for the minus operation', () => {
  expect( typeof messages.getRandomMessage( 'minus' ) ).toBe( 'string' );
});

test( 'A message is returned for the selfPlus operation', () => {
  expect( typeof messages.getRandomMessage( 'selfPlus' ) ).toBe( 'string' );
});

test( 'An error occurs for an invalid operation', () => {
  expect( () => {
    messages.getRandomMessage( 'INVALID_OPERATION' );
  }).toThrow();
});
