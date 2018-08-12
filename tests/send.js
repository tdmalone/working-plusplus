/**
 * Unit tests on the code in send.js.
 *
 * @see https://jestjs.io/docs/en/expect
 * @author Tim Malone <tdmalone@gmail.com>
 */

/* global jest */

'use strict';

const send = require( '../src/send' );
const slackClientMock = require( './mocks/slack' );

send.setSlackClient( slackClientMock );

// Catch all console output during tests.
console.error = jest.fn();
console.info = jest.fn();
console.log = jest.fn();
console.warn = jest.fn();

describe( 'setSlackClient', () => {

  it( 'accepts a single parameter (that is later used as the Slack API client)', () => {
    expect( send.setSlackClient ).toHaveLength( 1 );
  });

});

describe( 'sendMessage', () => {

  // TODO:

});
