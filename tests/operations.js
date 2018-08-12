/**
 * Unit tests on operations.js.
 *
 * @see https://jestjs.io/docs/en/expect
 * @author Tim Malone <tdmalone@gmail.com>
 */

/* global jest */

'use strict';

const operations = require( '../src/operations' );

it( 'exports constants for operations', () => {
  expect( operations.operations )
    .toBeObject()
    .toHaveProperty( 'PLUS' )
    .toHaveProperty( 'MINUS' )
    .toHaveProperty( 'SELF' );
});

describe( 'getOperationName', () => {

  // TODO:

});
