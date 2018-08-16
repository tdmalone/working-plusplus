/**
 * Contains logic for returning the leaderboard.
 */

'use strict';

const send = require( './send' ),
      points = require( './points' ),
      helpers = require( './helpers' );

/**
 * Gets the URL for the full leaderboard, including a token to ensure that it is only viewed by
 * someone who has access to this Slack team.
 *
 * @param {string} hostname The hostname this app is being served on.
 * @returns {string} The leaderboard URL, which will be picked up in ../index.js when called.
 */
const getLeaderboardUrl = ( hostname ) => {
  const ts = helpers.getTimestamp(),
        token = helpers.getTimeBasedToken( ts ),
        url = 'https://' + hostname + '/leaderboard?token=' + token + '&ts=' + ts;

  return url;
};

/**
 * Retrieves and sends the current leaderboard to the requesting Slack channel.
 *
 * @param {object} event   A hash of a validated Slack 'app_mention' event. See the docs at
 *                         https://api.slack.com/events-api#events_dispatched_as_json and
 *                         https://api.slack.com/events/app_mention for details.
 * @param {object} request The Express request object that resulted in this handler being run.
 * @returns {Promise} A Promise to send the Slack message.
 */
const handler = async( event, request ) => {

  const limit = 5;

  const topScores = await points.retrieveTopScores(),
        users = [],
        things = [];

  let lastUserScore, lastUserRank,
      lastThingScore, lastThingRank;

  // Process the top scores, including applying their ranks.
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

  const messageText = (
    'Here you go. ' +
    'Or see the <' + getLeaderboardUrl( request.headers.host ) + '|whole list>.'
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
  getLeaderboardUrl,
  handler
};
