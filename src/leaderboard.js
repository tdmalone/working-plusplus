/**
 * Contains logic for returning the leaderboard.
 */

'use strict';

const send = require( './send' ),
      points = require( './points' ),
      helpers = require( './helpers' );

const crypto = require( 'crypto' );

/**
 * Retrieves and sends the current leaderboard to the requesting Slack channel.
 *
 * @param {object} event  A hash of a validated Slack 'app_mention' event. See the docs at
 *                        https://api.slack.com/events-api#events_dispatched_as_json and
 *                        https://api.slack.com/events/app_mention for details.
 * @returns {Promise} A Promise to send the Slack message.
 */
const handler = async( event, request ) => {

  const limit = 5;

  const topScores = await points.retrieveTopScores();
  const users = [],
        things = [];

  let lastUserScore, lastUserRank,
      lastThingScore, lastThingRank;

  for ( const topScore of topScores ) {
    const item = helpers.maybeLinkItem( topScore.item ),
          itemTitleCase = item.substring( 0, 1 ).toUpperCase() + item.substring( 1 ),
          plural = helpers.isPlural( topScore.score ) ? 's' : '',
          message = itemTitleCase + ' [' + topScore.score + ' point' + plural + ']';

    if ( helpers.isUser( topScore.item ) ) {
      const rank = topScore.score === lastUserScore ? lastUserRank : users.length + 1;
      users.push( rank + '. ' + message + ( users.length ? '' : ' :muscle:' ) );
      lastUserRank = rank;
      lastUserScore = topScore.score;
    } else {
      const rank = topScore.score === lastThingScore ? lastThingRank : things.length + 1;
      things.push( rank + '. @' + message + ( things.length ? '' : ' :tada:' ) );
      lastThingRank = rank;
      lastThingScore = topScore.score;
    }
  }

  const ts = Math.floor( Date.now() / 1000 ),
        secret1 = process.env.SLACK_VERIFICATION_TOKEN,
        secret2 = process.env.DATABASE_URL,
        token = crypto.createHmac( 'sha256', secret1 ).update( ts + secret2 ).digest( 'hex' ),
        url = 'https://' + request.headers.host + '/leaderboard?token=' + token + '&ts=' + ts;

  const messageText = (
    'Here you go. '

    // TODO: Enable the below once ready.
    //+ 'Or see the <' + url + '|whole list>.'
  );

  const message = {
    attachments: [
      {
        text: messageText,
        color: 'good',
        fields: [
          {
            title: 'Users',
            value: users.slice( 0, limit ).join( '\n' ),
            short: true
          },
          {
            title: 'Things',
            value: things.slice( 0, limit ).join( '\n' ),
            short: true
          }
        ]
      }
    ]
  };

  console.log( 'Sending the leaderboard.' );
  return send.sendMessage( message, event.channel );
};

module.exports = {
  handler
};
