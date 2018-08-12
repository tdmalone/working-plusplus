/**
 * Handles incoming events, using Slack's Events API. See also send.js, which handles outgoing
 * messages sent back to Slack.
 *
 * @see https://api.slack.com/events-api
 */

'use strict';

const send = require( './send' ),
      points = require( './points' ),
      helpers = require( './helpers' ),
      messages = require( './messages' ),
      operations = require( './operations' );

const camelCase = require( 'lodash.camelcase' );

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
  return send.sendMessage( message, channel );
};

/**
 * Handles a plus or minus against a user, and then notifies the channel of the new score.
 *
 * @param {string} item      The Slack user ID (if user) or name (if thing) of the item being
 *                           operated on.
 * @param {string} operation The mathematical operation performed on the item's score.
 * @param {object} channel   The ID of the channel (Cxxxxxxxx for public channels or Gxxxxxxxx for
 *                           private channels - aka groups) that the message was sent from.
 * @return {Promise} A Promise to send a Slack message back to the requesting channel after the
 *                   points have been updated.
 */
const handlePlusMinus = async( item, operation, channel ) => {
  const score = await points.updateScore( item, operation ),
        operationName = operations.getOperationName( operation ),
        message = messages.getRandomMessage( operationName, item, score );

  return send.sendMessage( message, channel );
};

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
  message: ( event ) => {

    // Extract the relevant data from the message text.
    const { item, operation } = helpers.extractEventData( event.text );

    if ( ! item || ! operation ) {
      return false;
    }

    // Bail if the user is trying to ++ themselves...
    if ( item === event.user && '+' === operation ) {
      handleSelfPlus( event.user, event.channel );
      return false;
    }

    // Otherwise, let's go!
    return handlePlusMinus( item, operation, event.channel );

  }, // Message event.

  /**
   * Handles 'app_mention' events sent from Slack.
   *
   * @param {object} event  A hash of a validated Slack 'app_mention' event. See the docs at
   *                        https://api.slack.com/events-api#events_dispatched_as_json and
   *                        https://api.slack.com/events/app_mention for details.
   * @return {bool|Promise} Either `false` if the event cannot be handled, or a Promise to send a
   *                        Slack message back to the requesting channel.
   */
  appMention: async( event ) => {

    // TODO: Handle this event.
    console.log( event );

  } // AppMention event.

}; // Handlers.

/**
 * Determines whether or not incoming events from Slack can be handled by this app, and if so,
 * passes the event off to its handler function.
 *
 * @param {object} event  A hash of a Slack event. See the documentation at
 *                        https://api.slack.com/events-api#events_dispatched_as_json and
 *                        https://api.slack.com/events/message for details.
 * @return {bool|Promise} Either `false` if the event cannot be handled, or a Promise as returned
 *                        by the event's handler function.
 */
const handleEvent = ( event ) => {

  // If the event has no type, something has gone wrong.
  if ( 'undefined' === typeof event.type ) {
    console.warn( 'Event data missing' );
    return false;
  }

  // If the event has a subtype, we don't support it.
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
    return handlers[ eventName ] ( event );
  }

  console.warn( 'Invalid event received: ' + event.type );
  return false;

}; // HandleEvent.

module.exports = {
  handleSelfPlus,
  handlePlusMinus,
  handlers,
  handleEvent
};
