/**
 * Unit tests on the code in leaderboard.js.
 *
 * @see https://jestjs.io/docs/en/expect
 * @see https://github.com/jest-community/jest-extended#api
 * @author Tim Malone <tdmalone@gmail.com>
 */

/* global jest */

'use strict';

const leaderboard = require( '../src/leaderboard' ),
      helpers = require( '../src/helpers' );

describe( 'getLeaderboardUrl', () => {

  const MILLISECONDS_TO_SECONDS = 1000;

  const request = {
    headers: { host: 'test.local' },
    body: { event: { text: '<@U00000000> test' } }
  };

  const leaderboardUrl = leaderboard.getLeaderboardUrl( request ),
        parsedUrl = new URL( leaderboardUrl ),
        token = parsedUrl.searchParams.get( 'token' ),
        ts = parsedUrl.searchParams.get( 'ts' ),
        now = Math.floor( Date.now() / MILLISECONDS_TO_SECONDS );

  it( 'returns a well-formed URL that doesn\'t need fixing', () => {
    expect( leaderboardUrl ).toBe( parsedUrl.href );
  });

  it( 'returns a URL with a hostname', () => {
    expect( parsedUrl.hostname ).toBeString();
  });

  it( 'returns a URL with a path', () => {
    expect( parsedUrl.pathname ).toBeString();
  });

  it( 'returns an HTTPS URL', () => {
    expect( parsedUrl.protocol ).toBe( 'https:' );
  });

  it( 'includes a token parameter for authorization', () => {
    expect( token ).toBeString();
  });

  it( 'includes a ts (timestamp) parameter for authorization', () => {
    expect( ts ).toBeString();
  });

  it( 'has a ts (timestamp) parameter that was just created', () => {
    expect( ts ).toBeWithin( now - 5, now + 1 );
  });

  it( 'has a token that can be validated using the timestamp', () => {
    expect( helpers.isTimeBasedTokenStillValid( token, now ) ).toBeTrue();
  });

  it( 'has a token that fails to validate with a different timestamp', () => {
    expect( helpers.isTimeBasedTokenStillValid( token, now - 1 ) ).toBeFalse();
  });

}); // GetLeaderboardUrl.

// TODO: Add tests for handler().
