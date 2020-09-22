/**
 * Contains logic for returning the leaderboard.
 *
 * @author Tim Malone <tdmalone@gmail.com>
 */

'use strict';

const slack = require( './slack' ),
      points = require( './points' ),
      helpers = require( './helpers' );

const querystring = require( 'querystring' );

/**
 * Gets the URL for the full leaderboard, including a token to ensure that it is only viewed by
 * someone who has access to this Slack team.
 *
 * @param {object} request The Express request object that resulted in this handler being run.
 * @returns {string} The leaderboard URL, which will be picked up in ../index.js when called.
 */
const getLeaderboardUrl = ( request ) => {

  const hostname = request.headers.host,
        ts = helpers.getTimestamp();

  const params = {
    token: helpers.getTimeBasedToken( ts ),
    ts,
    botUser: helpers.extractUserID( request.body.event.text )
  };
  // eslint-disable-next-line no-process-env,no-negated-condition,yoda
  const protocol = process.env.SCOREBOT_USE_SSL !== '1' ? 'http://' : 'https://';
  return protocol + hostname + '/leaderboard?' + querystring.stringify( params );

}; // GetLeaderboardUrl.

/**
 * Ranks items by their scores, returning them in a human readable list complete with emoji for the
 * winner. Items which draw will be given the same rank, and the next rank will then be skipped.
 *
 * For example, 2 users on 54 would draw 1st. The next user on 52 would be 3rd, and the final on 34
 * would be 4th.
 *
 * @param {array}  topScores An array of score objects, usually pre-retrieved by
 *                           points.retrieveTopScores(). These *must* be in 'top score' order (i.e.
 *                           descending order), otherwise ranking will not function correctly. Score
 *                           objects contain 'item' and 'score' properties.
 * @param {string} itemType  The type of item to rank. Accepts 'users' or 'things'. Only one type
 *                           can be ranked at a time.
 * @param {string} format    The format to return the results in. 'slack' returns or 'object'.
 *
 * @returns {array} An array, in rank order, of either of either human-readable Slack strings (if
 *                  format is 'slack') or objects containing 'rank', 'item' and 'score' values (if
 *                  format is 'object').
 */
const rankItems = async( topScores, itemType = 'users', format = 'slack' ) => {

  let lastScore, lastRank, output;
  const items = [];

  for ( const score of topScores ) {

    let item = score.item;
    const isUser = helpers.isUser( score.item ) ? true : false;

    // Skip if this item is not the item type we're ranking.
    if ( isUser && 'users' !== itemType || ! isUser && 'users' === itemType ) {
      continue;
    }

    // For users, we need to link the item (for Slack) or get their real name (for other formats).
    if ( isUser ) {
      item = (
        'slack' === format ? helpers.maybeLinkItem( item ) : await slack.getUserName( item )
      );
    }

    const itemTitleCase = item.substring( 0, 1 ).toUpperCase() + item.substring( 1 ),
          plural = helpers.isPlural( score.score ) ? 's' : '';

    // Determine the rank by keeping it the same as the last user if the score is the same, or
    // otherwise setting it to the same as the item count (and adding 1 to deal with 0-base count).
    const rank = score.score === lastScore ? lastRank : items.length + 1;

    switch ( format ) {
      case 'slack':

        output = (
          rank + '. ' + itemTitleCase + ' [' + score.score + ' point' + plural + ']'
        );

        // If this is the first item, it's the winner!
        if ( ! items.length ) {
          output += ' ' + ( isUser ? ':muscle:' : ':tada:' );
        }

        break;

      case 'object':
        output = {
          rank,
          item: itemTitleCase,
          score: score.score + ' point' + plural
        };
        break;
    }

    items.push( output );

    lastRank = rank;
    lastScore = score.score;

  } // For scores.

  return items;

}; // RankItems.

/**
 * Retrieves and sends the current partial leaderboard (top scores only) to the requesting Slack
 * channel.
 *
 * @param {object} event   A hash of a validated Slack 'app_mention' event. See the docs at
 *                         https://api.slack.com/events-api#events_dispatched_as_json and
 *                         https://api.slack.com/events/app_mention for details.
 * @param {object} request The Express request object that resulted in this handler being run.
 * @returns {Promise} A Promise to send the Slack message.
 */
const getForSlack = async( event, request ) => {

  const limit = 5;

  const scores = await points.retrieveTopScores(),
        users = await rankItems( scores, 'users' ),
        things = await rankItems( scores, 'things' );

  const messageText = (
    'Here you go. ' +
    'Or see the <' + getLeaderboardUrl( request ) + '|whole list>.'
  );

  const message = {
    attachments: [
      {
        text: messageText,
        color: 'good', // Slack's 'green' colour.
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
  return slack.sendMessage( message, event.channel );

}; // GetForSlack.

/**
 * Retrieves and returns HTML for the full leaderboard, for displaying on the web.
 *
 * @param {object} request The Express request object that resulted in this handler being run.
 * @returns {string} HTML for the browser.
 */
const getForWeb = async( request ) => {

  const scores = await points.retrieveTopScores(),
        users = await rankItems( scores, 'users', 'object' ),
        things = await rankItems( scores, 'things', 'object' );

  const data = {
    users,
    things,
    title: 'Leaderboard'
  };

  return helpers.render( 'src/html/leaderboard.html', data, request );

}; // GetForWeb.

/**
 * The default handler for this command when invoked over Slack.
 *
 * @param {*} event   See the documentation for getForSlack.
 * @param {*} request See the documentation for getForSlack.
 * @returns {*} See the documentation for getForSlack.
 */
const handler = async( event, request ) => {
  return getForSlack( event, request );
};

module.exports = {
  getLeaderboardUrl,
  rankItems,
  getForSlack,
  getForWeb,
  handler
};
