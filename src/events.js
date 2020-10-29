/**
 * Handles incoming events, using Slack's Events API. See also send.js, which handles outgoing
 * messages sent back to Slack.
 *
 * @see https://api.slack.com/events-api
 */

'use strict';

const slack = require( './slack' ),
      points = require( './points' ),
      helpers = require( './helpers' ),
      messages = require( './messages' ),
      operations = require( './operations' ),
      leaderboard = require( './leaderboard' );

const camelCase = require( 'lodash.camelcase' );

const timeLimit = Math.floor(process.env.UNDO_TIME_LIMIT / 60);

/**
 * Handles an attempt by a user to 'self plus' themselves, which includes both logging the attempt
 * and letting the user know it wasn't successful.
 *
 * @param {object} user    The ID of the user (Uxxxxxxxx) who tried to self plus.
 * @param {object} channel The ID of the channel (Cxxxxxxxx for public channels or Gxxxxxxxx for
 *                         private channels - aka groups) that the message was sent from.
 * @return {Promise} A Promise to send a Slack message back to the requesting channel.
 */
const handleSelfPlus = ( user, channel ) => {
  console.log( user + ' tried to alter their own score.' );
  const message = messages.getRandomMessage( operations.operations.SELF, user );
  return slack.sendEphemeral( message, channel, user );
};

const usersList = [];

/**
 *
 * Handles a plus or minus against a user, and then notifies the channel of the new score.
 * Processes data. Checks if user, channel exist in the database,
 * if not it creates them and returns the
 * random message.
 *
 * @param {string} item      The Slack user ID (if user) or name (if thing) of the item being
 *                           operated on.
 * @param {string} operation The mathematical operation performed on the item's score.
 * @param {string} channel   The ID of the channel (Cxxxxxxxx for public channels or Gxxxxxxxx for
 *                           private channels - aka groups) that the message was sent from.
 * @param {string} userVoting     The User voting.
 * @return {Promise<string>} Returns random message.
 */
const processUserData = async( item, operation, channel, userVoting, description ) => {
  const dbUserTo = await points.checkUser( item );
  const dbUserFrom = await points.checkUser( userVoting );
  const checkChannel = await points.checkChannel( channel );
  const score = await points.updateScore( dbUserTo, dbUserFrom, checkChannel, description ),
        operationName = operations.getOperationName( operation );

  const findVoter = usersList.find( ( user ) => user.voter === userVoting );
  if ( findVoter ) {
    const location = usersList.indexOf( userVoting );
    usersList.splice( location, 1 );
  }
  usersList.push({
    voter: userVoting,
    user: item
  });
  return messages.getRandomMessage( operationName, item, score );

};

/**
 *  Checks if the operation is supported and if the userVoting has reached daily limit
 *  and returns public slack message or sendEphemeral message.
 *
 * @param {string} item      The Slack user ID (if user) or name (if thing) of the item being
 *                           operated on.
 * @param {string} operation The mathematical operation performed on the item's score.
 * @param {string} channel   The ID of the channel (Cxxxxxxxx for public channels or Gxxxxxxxx for
 *                           private channels - aka groups) that the message was sent from.
 * @param {string} userVoting     The User voting.
 * @return {Promise} A Promise to send a Slack message back to the requesting channel after the
 *                   points have been updated.
 */
const handlePlusMinus = async( item, operation, channel, userVoting, description ) => {
  try {
    if ( '-' === operation ) {
      return null;
    } else if ( '+' === operation ) {

      // TODO: implement check for ban.
      let message;
      const userLimit = await points.getDailyUserScore( userVoting );
      if ( userLimit.operation ) {
        message = await processUserData( item, operation, channel, userVoting, description );
      } else {
        return slack.sendEphemeral( userLimit.message, channel, userVoting );
      }

      return slack.sendEphemeral( message, channel, userVoting );
    }
  } catch ( err ) {
    console.error( err.message );
  }
};

/**
 * Undoes last ++
 *
 * @param {*} event     Slack event.
 * @returns {Promise}   A promise sent to slack to send the messate.
 */
const undoPlus = async( event ) => {
  try {
    let message;
    const findVoter = usersList.find( ( user ) => user.voter === event.user );
    if ( findVoter ) {
      const location = usersList.indexOf( event.user );
      usersList.splice( location, 1 );

      const score = await points.undoScore( event.user, findVoter.user, event.channel );
      // eslint-disable-next-line no-negated-condition
      if ( 'undefined' !== typeof score ) {
        const operationName = operations.getOperationName( '-' );
        message = messages.getRandomMessage( operationName, findVoter.user, score );
      } else {
        message = 'You can undo only for duration of ' + timeLimit + ' minutes after up voting!';
        return slack.sendEphemeral( message, event.channel, event.user );
      }

    } else {
      message = '<@' + event.user + '> there is nothing to undo!';
      return slack.sendEphemeral( message, event.channel, event.user );
    }

    return slack.sendEphemeral( message, event.channel, event.user );

  } catch ( err ) {
    console.log( err.message );
  }

};

/**
 * Sends a random thank you message to the requesting channel.
 *
 * @param {object} event   A hash of a validated Slack 'app_mention' event. See the docs at
 *                         https://api.slack.com/events-api#events_dispatched_as_json and
 *                         https://api.slack.com/events/app_mention for details.
 * @returns {Promise} A Promise to send the Slack message.
 */
const sayThankyou = ( event ) => {

  const thankyouMessages = [
    'Don\'t mention it!',
    'You\'re welcome.',
    'Pleasure!',
    'No thank YOU!',
    (
      '++ for taking the time to say thanks!\n...' +
      'just kidding, I can\'t `++` you. But it\'s the thought that counts, right??'
    )
  ];

  const randomKey = Math.floor( Math.random() * thankyouMessages.length ),
        message = '<@' + event.user + '> ' + thankyouMessages[ randomKey ];

  return slack.sendEphemeral( message, event.channel, event.user );

}; // SayThankyou.

/**
 * Sends a help message, explaining the bot's commands, to the requesting channel.
 *
 * @param {object} event   A hash of a validated Slack 'app_mention' event. See the docs at
 *                         https://api.slack.com/events-api#events_dispatched_as_json and
 *                         https://api.slack.com/events/app_mention for details.
 * @returns {Promise} A Promise to send the Slack message.
 */
const sendHelp = async( event ) => {

  const botUserID = await helpers.extractUserID( event.text );
  const userName = await slack.getUserName( botUserID ); // 'U01ASBLRRNZ'

  // const userList = await slack.getUserList();
  // console.log("USERS: " + JSON.stringify(userList));
  // console.log("USERNAME: " + userName);
  // console.log("BOT USER ID: " + botUserID);

  const message = (
    'Sure, here\'s what I can do:\n\n' +
    '• `<@Someone> ++ [reason]`: Add a point to user, optionally you can add a reason.\n' +
    '• `<@' + userName + '> undo`: Undo last added point (only works ' + timeLimit + ' minutes after you gave ++).\n' +
    '• `<@' + userName + '> leaderboard`: Display the leaderboard.\n' +
    '• `<@' + userName + '> help`: Display this message.\n\n'
  );

  return slack.sendEphemeral( message, event.channel, event.user );

}; // SendHelp.

const handlers = {

  /**
   * Handles standard incoming 'message' events sent from Slack.
   *
   * Assumes basic validation has been done before receiving the event. See handleEvent().
   *
   * @param {object} event  A hash of a validated Slack 'message' event. See the documentation at
   *                        https://api.slack.com/events-api#events_dispatched_as_json and
   *                        https://api.slack.com/events/message for details.
   * @return {bool|Promise} Either `false` if the event cannot be handled, or a Promise to send a
   *                        Slack message back to the requesting channel.
   */
  message: async( event ) => {

    // Extract the relevant data from the message text.
    const { item, operation, description } = helpers.extractPlusMinusEventData( event.text );

    const userList = await slack.getUserList();
    const userIsBot = Boolean(Object.values(userList).find(user => user.id === item && user.is_bot === true));

    if ( userIsBot && 'undo' === operation ) {
      undoPlus( event );
      return false;
    }

    if ( ! item || ! operation || userIsBot ) {
      return false;
    }

    // Bail if the user is trying to ++ themselves...
    if ( item === event.user && '+' === operation ) {
      handleSelfPlus( event.user, event.channel );
      return false;
    }

    // Otherwise, let's go!
    return handlePlusMinus( item, operation, event.channel, event.user, description );

  }, // Message event.

  /**
   * Handles 'app_mention' events sent from Slack, primarily by looking for known app commands, and
   * then handing the command off for processing.
   *
   * @param {object} event   A hash of a validated Slack 'app_mention' event. See the docs at
   *                         https://api.slack.com/events-api#events_dispatched_as_json and
   *                         https://api.slack.com/events/app_mention for details.
   * @param {object} request The incoming Express request object for this event.
   * @return {bool|Promise} Either `false` if the event cannot be handled, or a Promise - usually
   *                        to send a Slack message back to the requesting channel - which will be
   *                        handled by the command's own handler.
   */
  appMention: ( event, request ) => {

    const appCommandHandlers = {
      leaderboard: leaderboard.handler,
      help: sendHelp,
      thx: sayThankyou,
      thanks: sayThankyou,
      thankyou: sayThankyou
    };

    const validCommands = Object.keys( appCommandHandlers ),
          appCommand = helpers.extractCommand( event.text, validCommands );

    if ( appCommand ) {
      return appCommandHandlers[appCommand]( event, request );
    }

    if ( '++' ) {
      return null;
    }

    const defaultMessage = (
      'Sorry, I\'m not quite sure what you\'re asking me. I\'m not very smart - there\'s only a ' +
      'few things I\'ve been trained to do. Send me `help` for more details.'
    );

    return slack.sendEphemeral( defaultMessage, event.channel, event.user );

  } // AppMention event.
}; // Handlers.

/**
 * Determines whether or not incoming events from Slack can be handled by this app, and if so,
 * passes the event off to its handler function.
 *
 * @param {object} event   A hash of a Slack event. See the documentation at
 *                         https://api.slack.com/events-api#events_dispatched_as_json and
 *                         https://api.slack.com/events/message for details.
 * @param {object} request The incoming Express request object for this event.
 * @return {bool|Promise} Either `false` if the event cannot be handled, or a Promise as returned
 *                        by the event's handler function.
 */
const handleEvent = ( event, request ) => {

  // If the event has no type, something has gone wrong.
  if ( 'undefined' === typeof event.type ) {
    console.warn( 'Event data missing' );
    return false;
  }

  // If the event has a subtype, we don't support it.
  // TODO: We could look at this in the future, in particular, the bot_message subtype, which would
  //       allow us to react to messages sent by other bots. However, we'd have to be careful to
  //       filter appropriately, because otherwise we'll also react to messages from ourself.
  //       Because the 'help' output contains commands in it, that could look interesting!
  if ( 'undefined' !== typeof event.subtype ) {
    console.warn( 'Unsupported event subtype: ' + event.subtype );
    return false;
  }

  // If there's no text with the event, there's not a lot we can do.
  if ( 'undefined' === typeof event.text || ! event.text.trim() ) {
    console.warn( 'Event text missing' );
    return false;
  }

  // Providing we have a handler for the event, let's handle it!
  const eventName = camelCase( event.type );
  if ( handlers[ eventName ] instanceof Function ) {
    return handlers[ eventName ] ( event, request );
  }

  console.warn( 'Invalid event received: ' + event.type );
  return false;

}; // HandleEvent.

module.exports = {
  handleSelfPlus,
  handlePlusMinus,
  sayThankyou,
  sendHelp,
  handlers,
  handleEvent
};
