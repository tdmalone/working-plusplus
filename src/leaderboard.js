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
 * @param {string} channelId  ChannelId to get score for.
 * @returns {string} The leaderboard URL, which will be picked up in ../index.js when called.
 */
const getLeaderboardUrl = ( request, channelId ) => {

  const hostname = request.headers.host;

  const params = {
    channel: channelId
  };
  // eslint-disable-next-line no-process-env,no-negated-condition,yoda
  const protocol = process.env.SCOREBOT_USE_SSL !== '1' ? 'http://' : 'https://';
  return protocol + hostname + '/leaderboard?' + querystring.stringify( params );

}; // GetLeaderboardUrl.

const getLeaderboardWeb = ( request, channelId ) => {

  const params = {
    channel: channelId
  };
  // eslint-disable-next-line no-process-env,no-negated-condition,yoda
  const protocol = process.env.SCOREBOT_USE_SSL !== '1' ? 'http://' : 'https://';
  const frontendUrl = process.env.SCOREBOT_LEADERBOARD_URL;
  return protocol + frontendUrl + '?' + querystring.stringify( params );

}; // GetLeaderboardWeb.

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
          score: score.score + ' point' + plural,
          item_id: score.item
        };
        break;
    }

    items.push( output );

    lastRank = rank;
    lastScore = score.score;

  } // For scores.

  return items;

}; // RankItems.

const userScores = async( topScores ) => {

  const items = [];
  let output;

  for ( const score of topScores ) {

    let toUser = score.item;
    let fromUser = score.from_user_id;
    let userScore = score.score;
    let channel = score.channel_id;

    const isUser = helpers.isUser( toUser ) ? true : false;

    if (isUser) {
      toUser = await slack.getUserName( toUser );
      fromUser = await slack.getUserName( fromUser );
      channel = await slack.getChannelName( channel )
    }

    output = {
      toUser: toUser,
      fromUser: fromUser,
      score: userScore,
      channel: '#' + channel
    }

    items.push( output );
    console.log("OUTPUT: " + JSON.stringify(output));

  }

  return items;

}

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

  try {
    const limit = 5;

    const scores = await points.retrieveTopScores( event.channel ),
          users = await rankItems( scores, 'users' );

    // Things = await rankItems( scores, 'things' );

    const messageText = (
      'Here you go. Best people this month in channel <#' + event.channel + '|' +
       await slack.getChannelName( event.channel ) + '>.'
    );

    const bottomMessageText = (
      'Or see the <' + getLeaderboardWeb( request, event.channel ) + '|whole list>. '
    );

    const noUsers = (
      'No Users on Leaderboard.'
    );

    let message;
    if (users === undefined || users.length == 0) {
      message = {
        attachments: [
          {
            text: noUsers,
            color: 'danger'
          }
        ]
      }
    } else {
      message = {
        attachments: [
          {
            text: messageText,
            color: 'good', // Slack's 'green' colour.
            fields: [
              {
                value: users.slice( 0, limit ).join( '\n' ),
                short: true
              },
              {
                value: '\n' + bottomMessageText
              }

              // {
              //   title: 'Things',
              //   value: things.slice( 0, limit ).join( '\n' ),
              //   short: true
              // }
            ]
          }
        ]
      };
    }

    console.log( 'Sending the leaderboard.' );
    return slack.sendEphemeral( message, event.channel, event.user );
  } catch ( err ) {
    console.error( err.message );
  }

}; // GetForSlack.

/**
 * Retrieves and returns HTML for the full leaderboard, for displaying on the web.
 *
 * @param {object} request The Express request object that resulted in this handler being run.
 * @returns {string} HTML for the browser.
 */
const getForWeb = async( request ) => {

  try {

    const startDate = request.query.startDate;
    const endDate = request.query.endDate;
    const channelId = request.query.channel;

    const scores = await points.retrieveTopScores( channelId, startDate, endDate );
    const users = await rankItems( scores, 'users', 'object' );

    console.log(users);
    return users;

  } catch ( err ) {
    console.error( err.message );
  }

}; // GetForWeb.

/**
 * Retrieves and returns all channels, for displaying on the web.
 *
 * @param {object} request The Express request object that resulted in this handler being run.
 * @returns {string} JSON for the browser.
 */
const getForChannels = async( request ) => {

  try {
    const channels = await points.getAllChannels();

    console.log( 'Sending all Channels!' );
    return channels;
  } catch ( err ) {
    console.error( err.message );
  }

}; // GetForChannels.

/**
 * Retrieves all scores from_user_id, for displaying on the web.
 *
 * @param {object} request The Express request object that resulted in this handler being run.
 * @returns {string} JSON for the browser.
 */
const getAllScoresFromUser = async( request ) => {

  try {
    const startDate = request.query.startDate;
    const endDate = request.query.endDate;
    const channelId = request.query.channel;
    // console.log(request.query);
    const fromUsers = await points.getAllScoresFromUser( channelId, startDate, endDate );
    // console.log("FROMUSERS: " + JSON.stringify(fromUsers));

    const users = await userScores( fromUsers );
    // console.log("USERS: " + JSON.stringify(users));
    // const users = await userScores( fromUsers );

    console.log( 'Sending all From Users Scores!');
    // console.log("FROM USERS: " + JSON.stringify(users));

    return users;
  } catch ( err ) {
    console.error( err.message );
  }

}; // getAllScoresFromUser.

/**
 * Retrieves all added karma with descriptions, for displaying on the web.
 *
 * @param {object} request The Express request object that resulted in this handler being run.
 * @returns {string} JSON for the browser.
 */
const getKarmaFeed = async( request ) => {

  try {

    const itemsPerPage = request.query.itemsPerPage;
    const page = request.query.page;
    const searchString = request.query.searchString;
    const startDate = request.query.startDate;
    const endDate = request.query.endDate;
    const channelId = request.query.channel;
    const feed = await points.getKarmaFeed(itemsPerPage, page, searchString, channelId, startDate, endDate);
    console.log( 'Sending Karma Feed!' );

    return feed;

  } catch ( err ) {
    console.error( err.message );
  }

}; // getKarmaFeed.



const getUserProfile = async( request ) => {

  try {
    const username = request.query.username;
    const fromTo = request.query.fromTo;
    const channel = request.query.channelProfile;

    const itemsPerPage = request.query.itemsPerPage;
    const page = request.query.page;
    const searchString = request.query.searchString;

    const scores = await points.retrieveTopScores( channel );
    const users = await rankItems( scores, 'users', 'object' );
    const userId = await points.getUserId( username );

    let userRank = 0;
    for (const el of users) {
      if (el.item_id === userId) {
        userRank = el.rank;
      }
    }

    const nameSurname = await points.getName( username );
    const karmaScore = await points.getAll( username, 'from', channel );
    const karmaGiven = await points.getAll( username, 'to', channel );
    const activityChartIn = await points.getAll( username, 'from', channel );
    const activityChartOut = await points.getAll( username, 'to', channel );
    const getAll = await points.getAll( username, fromTo, channel, itemsPerPage, page, searchString );


    // Count Karma Points from users
    let count = [];
    karmaScore.feed.map(u => u.fromUser).forEach(fromUser => { count[fromUser] = ( count[fromUser] || 0 ) + 1 });
    let karmaDivided = Object.entries(count).map(([key, value]) => ({ name: key, value})); //: Math.round((value/karmaScore.count) * 100), count: value 

    // Count All Received Karma Points by Days
    let countIn = [];
    activityChartIn.feed.map(d => d.timestamp.toISOString().split('T')[0]).forEach(fromUser => { countIn[fromUser] = ( countIn[fromUser] || 0 ) + 1 });
    let chartDatesIn = Object.entries(countIn).map(([key, value]) => ({ date: key, received: value, sent: 0}));

    // Count All Sent Karma Points by Days
    let countOut = [];
    activityChartOut.feed.map(d => d.timestamp.toISOString().split('T')[0]).forEach(fromUser => { countOut[fromUser] = ( countOut[fromUser] || 0 ) + 1 });
    let chartDatesOut = Object.entries(countOut).map(([key, value]) => ({ date: key, received: 0, sent: value}));

    // Add Sent & Received Karma by Days Into Array
    let sentReceived = chartDatesIn.concat(chartDatesOut);

    // Combine Sent & Received Karma by Same Days
    let b = {};
    let combineDates = [];

    for (let date in sentReceived) {
    
      let oa = sentReceived[date];
      let ob = b[oa.date];
    
      if (!ob) combineDates.push(ob = b[oa.date] = {});
    
      for (let k in oa) ob[k] = k==='date' ? oa.date : (ob[k]||0)+oa[k];

    }

    // Sort Dates
    combineDates.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    console.log('Sending user name and surname.');

    return {...getAll, nameSurname, allKarma: karmaScore.count, karmaGiven: karmaGiven.count, userRank: userRank, karmaDivided: karmaDivided, activity: combineDates};
    
  } catch (err) {
    console.error(err.message);
  }

} // getUserProfile

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
  handler,
  getForChannels,
  getAllScoresFromUser,
  getKarmaFeed,
  getUserProfile
};
