/**
 * Tests the ./messages.js file.
 *
 * @author Tim Malone <tdmalone@gmail.com>
 */

/* global expect */

'use strict';

const messages = require( '../messages' );

test( 'At least 1 plus operation message is exported', () => {
  expect( messages.plus.length ).toBeGreaterThanOrEqual( 1 );
});

test( 'At least 1 minus operation message is exported', () => {
  expect( messages.minus.length ).toBeGreaterThanOrEqual( 1 );
});

test( 'At least 1 selfPlus operation message is exported', () => {
  expect( messages.selfPlus.length ).toBeGreaterThanOrEqual( 1 );
});
