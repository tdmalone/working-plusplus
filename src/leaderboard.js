/**
 * Contains logic for returning the leaderboard.
 *
 * @author Tim Malone <tdmalone@gmail.com>
 */

'use strict';

const send = require( './send' ),
      points = require( './points' ),
      helpers = require( './helpers' );

const fs = require( 'fs' );

let leaderboardHtml;

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
 * @returns {array|object} Depending on the value of 'format', an array, in rank order, of either
 *                         human-readable Slack strings or objects containing 'rank', 'item' and
 *                         'score' values.
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
        'slack' === format ? helpers.maybeLinkItem( item ) : await send.getUserName( item )
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
 * Returns HTML for the full leaderboard.
 *
 * TODO: This should be split out into separate frontend generating functions for the boilerplate
 *       structure and stuff.
 *
 * @returns {string} HTML for the browser.
 */
const getFull = async() => {

  if ( ! leaderboardHtml ) {
    leaderboardHtml = fs.readFileSync( 'src/html/leaderboard.html', 'utf8' );
  }

  const scores = await points.retrieveTopScores(),
        users = await rankItems( scores, 'users', 'object' ),
        things = await rankItems( scores, 'things', 'object' );

  return helpers.render( leaderboardHtml, {
    users,
    things,
    title: 'Leaderboard'
  });
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

  const scores = await points.retrieveTopScores(),
        users = await rankItems( scores, 'users' ),
        things = await rankItems( scores, 'things' );

  const messageText = (
    'Here you go. ' +
    'Or see the <' + getLeaderboardUrl( request.headers.host ) + '|whole list>.'
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
  return send.sendMessage( message, event.channel );

}; // Handler.

module.exports = {
  getFull,
  getLeaderboardUrl,
  rankItems,
  handler
};
