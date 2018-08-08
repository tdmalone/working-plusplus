/**
 * Unit tests on the main app.js file.
 *
 * TODO: Add a lot more tests to this.
 *
 * @see https://jestjs.io/docs/en/expect
 * @author Tim Malone <tdmalone@gmail.com>
 */

'use strict';

const app = require( '../src/app' );

test( 'Event with missing type is caught as invalid', () => {
  const payload = {};
  expect( app.isValidEvent( payload ) ).toBe( false );
});
