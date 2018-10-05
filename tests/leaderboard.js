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
      helpers = require( '../src/helpers' ),
      points = require( '../src/points' ),
      slack = require( '../src/slack' );

const expressMock = require( './mocks/express' ),
      slackMock = require( './mocks/slack' );

slack.setSlackClient( slackMock );

// Catch all console output during tests.
console.error = jest.fn();
console.info = jest.fn();
console.log = jest.fn();
console.warn = jest.fn();

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

  const emojiMatcher = /:[a-z0-9_-]+:/;
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

  it( 'returns an array of strings by default', async() => {
    expect.hasAssertions();
    const items = await leaderboard.rankItems( scores );
    expect( items ).toBeArray();
    for ( const item of items ) {
      expect( item ).toBeString();
    }
  });

  it( 'returns an array of strings when the \'slack\' format is asked for', async() => {
    expect.hasAssertions();
    const items = await leaderboard.rankItems( scores, 'users', 'slack' );
    expect( items ).toBeArray();
    for ( const item of items ) {
      expect( item ).toBeString();
    }
  });

  it( 'returns an array of objects (rank, item, score, suffix) when asked for objects', async() => {
    expect.hasAssertions();
    const items = await leaderboard.rankItems( scores, 'users', 'object' );
    expect( items ).toBeArray();
    for ( const item of items ) {
      expect( item )
        .toBeObject()
        .toContainAllKeys([ 'rank', 'item', 'score', 'suffix' ]);
    }
  });

  it( 'returns only users by default', async() => {
    expect.hasAssertions();
    const items = await leaderboard.rankItems( scores );
    for ( const item of items ) {
      expect( item ).toMatch( /U[A-Z0-9]{8}/ );
    }
  });

  it( 'returns only users when users are asked for', async() => {
    expect.hasAssertions();
    const items = await leaderboard.rankItems( scores, 'users' );
    for ( const item of items ) {
      expect( item ).toMatch( /U[A-Z0-9]{8}/ );
    }
  });

  it( 'returns only things when things are asked for', async() => {
    expect.hasAssertions();
    const items = await leaderboard.rankItems( scores, 'things' );
    for ( const item of items ) {
      expect( item ).not.toMatch( /<@U[A-Z0-9]{8}>/ );
    }
  });

  it( 'returns items in order (when provided in order)', async() => {
    expect.hasAssertions();
    let count = 0;
    const items = await leaderboard.rankItems( scores, 'users' );
    for ( const item of items ) {
      count++;
      expect( item ).toContain( 'U00000' + count + '00' );
    }
  });

  it( 'includes an emoji for (and only for) the users ranked #1', async() => {
    expect.hasAssertions();
    const items = await leaderboard.rankItems( scores, 'users' );
    for ( const item of items ) {
      if ( item.match( /^1\.\s/ ) ) {
        expect( item ).toMatch( emojiMatcher );
      } else {
        expect( item ).not.toMatch( emojiMatcher );
      }
    }
  });

  it( 'includes an emoji for (and only for) the things ranked #1', async() => {
    expect.hasAssertions();
    const items = await leaderboard.rankItems( scores, 'things' );
    for ( const item of items ) {
      if ( item.match( /^1\.\s/ ) ) {
        expect( item ).toMatch( emojiMatcher );
      } else {
        expect( item ).not.toMatch( emojiMatcher );
      }
    }
  });

  it( 'uses the same rank for items with the same score', async() => {
    expect.hasAssertions();

    const scores = [
      {
        item: 'U00000100',
        score: 10
      }, {
        item: 'U00000200',
        score: 10
      }
    ];

    const items = await leaderboard.rankItems( scores, 'users' );
    expect( items[0]).toMatch( /^1\.\s/ ).toMatch( /\b10\b/ );
    expect( items[1]).toMatch( /^1\.\s/ ).toMatch( /\b10\b/ );
  });

  it( 'increments the rank if items are scored differently', async() => {
    expect.hasAssertions();

    const scores = [
      {
        item: 'Thing1',
        score: 10
      }, {
        item: 'Thing2',
        score: 1
      }
    ];

    const items = await leaderboard.rankItems( scores, 'things' );
    expect( items[0]).toMatch( /^1\.\s/ );
    expect( items[1]).toMatch( /^2\.\s/ );
  });

  it( 'starts from rank 1', async() => {
    expect.hasAssertions();
    const items = await leaderboard.rankItems( scores );
    expect( items[0]).toMatch( /^1\.\s/ );
  });

  it( 'links user\'s names', async() => {
    expect.hasAssertions();
    const items = await leaderboard.rankItems( scores, 'users' );
    for ( const item of items ) {
      expect( item ).toMatch( /<@U[A-Z0-9]{8}>/ );
    }
  });

  it( 'includes an item\'s current points', async() => {
    expect.hasAssertions();

    const scores = [
      {
        item: 'Thing1',
        score: 75391230183
      }
    ];

    const items = await leaderboard.rankItems( scores, 'things' );
    expect( items[0]).toContain( scores[0].score );
  });

  it( 'returns the correct rank, score and suffix when objects are asked for', async() => {
    expect.hasAssertions();

    const scores = [
      {
        item: 'Thing1',
        score: 1538931
      },
      {
        item: 'Thing2',
        score: 1
      }
    ];

    let count = 0;
    const items = await leaderboard.rankItems( scores, 'things', 'object' );
    for ( const item of items ) {
      const score = scores[count].score;
      expect( item )
        .toContainEntry([ 'rank', count + 1 ])
        .toContainEntry([ 'score', score ])
        .toContainEntry([ 'suffix', 'point' + ( 1 === score ? '' : 's' ) ]);
      count++;
    }
  });

}); // RankItems.

describe( 'getForSlack', () => {

  it( 'attempts to retrieve the top scores', async() => {
    expect.hasAssertions();

    points.retrieveTopScores = jest.fn( () => {
      return [ {
        item: '',
        score: 0
      } ];
    });

    await leaderboard.getForSlack({}, expressMock.request );
    expect( points.retrieveTopScores ).toHaveBeenCalledTimes( 1 );
  });

  it( 'returns a Promise to send a Slack message', () => {
    const getForSlack = leaderboard.getForSlack({}, expressMock.request );
    expect( getForSlack ).toBeInstanceOf( Promise );
  });

  it( 'sends a Slack message payload with attachment', async() => {
    expect.hasAssertions();
    slack.sendMessage = jest.fn();
    await leaderboard.getForSlack( expressMock.request.body.event, expressMock.request );

    expect( slack.sendMessage ).toHaveBeenCalledWith(
      expect.objectContaining({ attachments: [ expect.any( Object ) ] }),
      expect.anything(),
    );
  });

  it( 'sends a Slack message back to the requesting channel', async() => {
    expect.hasAssertions();
    slack.sendMessage = jest.fn();
    await leaderboard.getForSlack( expressMock.request.body.event, expressMock.request );

    expect( slack.sendMessage ).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining( expressMock.request.body.event.channel )
    );
  });

  it( 'sends a Slack attachment with fields for each of Users and Things', async() => {
    expect.hasAssertions();
    slack.sendMessage = jest.fn();
    await leaderboard.getForSlack( expressMock.request.body.event, expressMock.request );

    expect( slack.sendMessage ).toHaveBeenCalledWith(
      expect.objectContaining({
        attachments: [
          expect.objectContaining({
            fields: [
              expect.objectContaining({ title: 'Users' }),
              expect.objectContaining({ title: 'Things' })
            ]
          })
        ]
      }),
      expect.anything(),
    );
  });

  it( 'sends a Slack message containing a full leaderboard URL', async() => {
    expect.hasAssertions();
    slack.sendMessage = jest.fn();
    await leaderboard.getForSlack( expressMock.request.body.event, expressMock.request );

    expect( slack.sendMessage ).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringMatching( /<https:\/\/.*?>/ )
      }),
      expect.anything(),
    );
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
