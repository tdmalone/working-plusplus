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

/**
 * IsValidEvent.
 */

test( 'Event with message and text is reported as valid', () => {
  const payload = {
    type: 'message',
    text: 'Hello'
  };

  expect( app.isValidEvent( payload ) ).toBe( true );
});

test( 'Event with missing type is caught as invalid', () => {
  const payload = {
    text: 'Hello'
  };

  expect( app.isValidEvent( payload ) ).toBe( false );
});

test( 'Event with non-message type is caught as invalid', () => {
  const payload = {
    type: 'random',
    text: 'Hello'
  };

  expect( app.isValidEvent( payload ) ).toBe( false );
});

test( 'Event with a subtype is caught as invalid', () => {
  const payload = {
    type:    'message',
    subtype: 'random',
    text:    'Hello'
  };

  expect( app.isValidEvent( payload ) ).toBe( false );
});

test( 'Event without text set is caught as invalid', () => {
  const payload = {
    type: 'message'
  };

  expect( app.isValidEvent( payload ) ).toBe( false );
});

test( 'Event with only a space as text is caught as invalid', () => {
  const payload = {
    type: 'message',
    text: ' '
  };

  expect( app.isValidEvent( payload ) ).toBe( false );
});
