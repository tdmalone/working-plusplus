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

describe( 'rankItems', () => {

  const scores = [
    {
      item: 'U00000100',
      score: 10
    }, {
      item: 'Thing1',
      score: 10
    }, {
      item: 'U00000200',
      score: 10
    }, {
      item: 'U00000300',
      score: 8
    }, {
      item: 'U00000400',
      score: 5
    }, {
      item: 'Thing2',
      score: 1
    }, {
      item: 'U00000500',
      score: 0
    }, {
      item: 'Thing3',
      score: -5
    }
  ];

  it( 'returns an array of strings', async() => {
    expect.hasAssertions();
    const items = await leaderboard.rankItems( scores );
    expect( items ).toBeArray();
    expect( items[0]).toBeString();
  });

  it( 'returns only users when users are asked for', () => {

  });

  it( 'returns only things when things are asked for', () => {

  });

  it( 'returns users by default', () => {

  });

  it( 'returns users when users are asked for', () => {

  });

  it( 'returns items in order if provided in order', () => {

  });

  it( 'includes an emoji for the first user result', () => {

  });

  it( 'includes an emoji for the first thing result', () => {

  });

  it( 'uses the same rank for items with the same score', () => {

  });

  it( 'increments the rank if items are scored differently', () => {

  });

  it( 'starts from rank 1', () => {

  });

  it( 'links user\'s names', () => {

  });

  it( 'includes an @ before the name of items', () => {

  });

  it( 'includes a thing\'s current points', () => {

  });

}); // RankItems.

describe( 'getForSlack', () => {

  it( 'retrieves the top scores', () => {

  });

  it( 'separately ranks both users and things', () => {

  });

  it( 'returns a Promise to send a Slack message', () => {

  });

  it( 'sends a Slack message payload with attachment', () => {

  });

  it( 'sends a Slack message containing a full leaderboard URL', () => {

  });

}); // GetForSlack.

describe( 'getForWeb', () => {

  it( 'retrieves the top scores', () => {

  });

  it( 'separately ranks both users and things', () => {

  });

  it( 'returns a string of HTML', () => {

  });

  it( 'passes request data, users and things to the renderer', () => {

  });

}); // GetForWeb.

describe( 'handler', () => {

  it( 'passes the call to getForSlack', () => {

  });

}); // Handler.
