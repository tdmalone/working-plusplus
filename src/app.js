/**
 * Working PlusPlus++
 * Like plusplus.chat, but one that actually works, because you can host it yourself! 😉
 *
 * @see https://github.com/tdmalone/working-plusplus
 * @see https://api.slack.com/events-api
 * @see https://expressjs.com/en/4x/api.html
 * @author Tim Malone <tdmalone@gmail.com>
 */

/* global jest */

'use strict';

const pg = require( 'pg' ),
      { getRandomMessage } = require( './messages' ),
      operations = require( './operations' );

let slack;

// Get environment variables.
/* eslint-disable no-process-env */
const SLACK_VERIFICATION_TOKEN = process.env.SLACK_VERIFICATION_TOKEN,
      DATABASE_URL = process.env.DATABASE_URL,
      DATABASE_USE_SSL = 'false' === process.env.DATABASE_USE_SSL ? false : true;
/* eslint-enable no-process-env */

const HTTP_403 = 403,
      HTTP_500 = 500,
      scoresTableName = 'scores',
      postgresPoolConfig = {
        connectionString: DATABASE_URL,
        ssl: DATABASE_USE_SSL
      };

const postgres = new pg.Pool( postgresPoolConfig );

/**
 * Injects the Slack client to be used for all outgoing messages.
 *
 * @param {WebClient} client An instance of Slack's WebClient as documented at
 *                           https://slackapi.github.io/node-slack-sdk/web_api and
 *                           implemented at
 *                           https://github.com/slackapi/node-slack-sdk/blob/master/src/WebClient.ts
 * @returns {void}
 */
const setSlackClient = ( client ) => {
  slack = client;
};

/**
 * Determines whether or not incoming events from Slack can be handled by this app.
 *
 * @param {object} event A hash of a Slack event. See the documentation at
 *                       https://api.slack.com/events-api#events_dispatched_as_json and
 *                       https://api.slack.com/events/message for details.
 * @returns {bool} Whether or not the app can handle the provided event.
 */
const isValidEvent = ( event ) => {

  // If the event has no type, something has gone wrong.
  if ( 'undefined' === typeof event.type ) {
    console.warn( 'Event data missing' );
    return false;
  }

  // We only support the 'message' event.
  if ( 'message' !== event.type ) {
    console.warn( 'Invalid event received: ' + event.type );
    return false;
  }

  // If the event has a subtype, we don't support it.
  if ( 'undefined' !== typeof event.subtype ) {
    console.warn( 'Unsupported event subtype: ' + event.subtype );
    return false;
  }

  // If there's no text with the message, there's not a lot we can do.
  if ( 'undefined' === typeof event.text || ! event.text.trim() ) {
    console.warn( 'Message text missing' );
    return false;
  }

  return true;

}; // IsValidEvent.

/**
 * Gets the user or 'thing' that is being spoken about, and the 'operation' being done on it.
 * We take the operation down to one character, and also support — due to iOS' replacement of --.
 *
 * @param {string} text The message text sent through in the event.
 * @returns {object} An object containing both the 'item' being referred to - either a Slack user
 *                   ID (eg. 'U12345678') or the name of a 'thing' (eg. 'NameOfThing'); and the
 *                   'operation' being done on it - expressed as a valid mathematical operation
 *                   (i.e. + or -).
 */
const extractEventData = ( ( text ) => {
  const data = text.match( /@([A-Za-z0-9]+?)>?\s*([-+]{2}|—{1})/ );

  if ( ! data ) {
    return false;
  }

  return {
    item: data[1],
    operation: data[2].substring( 0, 1 ).replace( '—', '-' )
  };
});

/**
 * Sends a message back to the relevant Slack channel with a response.
 *
 * @param {string} item      The Slack user ID (if user) or name (if thing) of the item being
 *                           operated on.
 * @param {string} operation The mathematical operation performed on the item's score.
 * @param {int}    score     The item's score after potentially being updated by the operation.
 * @param {object} event     A hash of a Slack event. See the documentation at
 *                           https://api.slack.com/events-api#events_dispatched_as_json and
 *                           https://api.slack.com/events/message for details.
 * @return {Promise} A Promise to send a Slack message back to the requesting channel.
 */
const respondToUser = ( item, operation, score, event ) => {

  const itemMaybeLinked = item.match( /U[A-Z0-9]{8}/ ) ? '<@' + item + '>' : item;
  const operationName = operation.replace( '+', operations.PLUS ).replace( '-', operations.MINUS );
  const message = getRandomMessage( operationName, itemMaybeLinked, score );

  return new Promise( ( resolve, reject ) => {
    slack.chat.postMessage({
      channel: event.channel,
      text: message
    }).then( ( data ) => {

      if ( ! data.ok ) {
        console.error( 'Error occurred posting response.' );
        return reject();
      }

      console.log( item + ' now on ' + score );
      resolve();

    });

  }); // Return new Promise.
}; // RespondToUser.

/**
 * Updates the score of an item in the database. If the item doesn't yet exist, it will be inserted
 * into the database with an assumed initial score of 0.
 *
 * This function also sets up the database if it is not already ready, including creating the
 * scores table and activating the Postgres case-insensitive extension.
 *
 * @param {string} item      The Slack user ID (if user) or name (if thing) of the item being
 *                           operated on.
 * @param {string} operation The mathematical operation performed on the item's score.
 * @return {int} The item's new score after the update has been applied.
 */
const updateScore = async( item, operation ) => {

  // Connect to the DB, and create a table if it's not yet there.
  // We also set up the citext extension, so that we can easily be case insensitive.
  const dbClient = await postgres.connect();
  await dbClient.query( '\
    CREATE EXTENSION IF NOT EXISTS citext; \
    CREATE TABLE IF NOT EXISTS ' + scoresTableName + ' (item CITEXT PRIMARY KEY, score INTEGER); \
  ' );

  // Atomically record the action.
  // TODO: Fix potential SQL injection issues here, even though we know the input should be safe.
  await dbClient.query( '\
    INSERT INTO ' + scoresTableName + ' VALUES (\'' + item + '\', ' + operation + '1) \
    ON CONFLICT (item) DO UPDATE SET score = ' + scoresTableName + '.score ' + operation + ' 1; \
  ' );

  // Get the new value.
  // TODO: Fix potential SQL injection issues here, even though we know the input should be safe.
  const dbSelect = await dbClient.query( '\
    SELECT score FROM ' + scoresTableName + ' WHERE item = \'' + item + '\'; \
  ' );

  dbClient.release();
  return dbSelect.rows[0].score;

}; // UpdateScore.

/**
 * Handles events sent from Slack.
 *
 * @param {object} event A hash of a Slack event. See the documentation at
 *                       https://api.slack.com/events-api#events_dispatched_as_json and
 *                       https://api.slack.com/events/message for details.
 * @return {bool|Promise} Either `false` if the event cannot be handled, or a Promise to send a
 *                        Slack message back to the requesting channel.
 */
const handleEvent = async( event ) => {

  const { item, operation } = extractEventData( event.text );

  if ( ! item || ! operation ) {
    return false;
  }

  // If the user is trying to ++ themselves...
  if ( item === event.user && '+' === operation ) {

    const message = getRandomMessage( operations.SELF, '<@' + event.user + '>', 0 );

    slack.chat.postMessage({
      channel: event.channel,
      text: message
    }).then( ( data ) => {
      console.log(
        data.ok ?
          item + ' tried to alter their own score.' :
          'Error occurred posting response to user altering their own score.'
      );
    });

    return false;

  } // If self ++.

  const score = await updateScore( item, operation );
  return respondToUser( item, operation, score, event );

}; // HandleEvent.

/**
 * Simple logging of requests.
 *
 * @param {express.req} request An Express request. See https://expressjs.com/en/4x/api.html#req.
 * @return {void}
 */
const logRequest = ( request ) => {
  console.log(
    request.ip + ' ' + request.method + ' ' + request.path + ' ' + request.headers['user-agent']
  );
};

/**
 * Checks if the token supplied with an incoming event is valid. This ensures that events are not
 * processed from random requests not originating from Slack.
 *
 * WARNING: When checking the return value of this function, ensure you use strict equality so that
 *          an error response is not misinterpreted as truthy.
 *
 * TODO: Move to calculating the signature instead (newer, more secure method).
 *
 * @param {string} suppliedToken The token supplied in the request.
 * @param {string} serverToken   The token to validate against.
 * @return {object|bool} If invalid, an error object containing an 'error' with HTTP status code
 *                       and a 'message' to return to the user; otherwise, if valid, returns true.
 */
const validateToken = ( suppliedToken, serverToken ) => {

  // Sanity check for bad values on the server side - either empty, or still set to the default.
  if ( ! serverToken.trim() || 'xxxxxxxxxxxxxxxxxxxxxxxx' === serverToken ) {
    console.error( '500 Internal server error - bad verification value' );
    return {
      error: HTTP_500,
      message: 'Internal server error.'
    };
  }

  // Check that this is Slack making the request.
  if ( suppliedToken !== serverToken ) {
    console.error( '403 Access denied - incorrect verification token' );
    return {
      error: HTTP_403,
      message: 'Access denied.'
    };
  }

  // If we get here, we're good to go!
  return true;

}; // ValidateToken.

/**
 * Handles GET requests to the app.
 *
 * @param {express.req} request An Express request. See https://expressjs.com/en/4x/api.html#req.
 * @param {express.res} response An Express response. See https://expressjs.com/en/4x/api.html#res.
 * @return {void}
 */
const handleGet = ( request, response ) => {
  logRequest( request );
  response.send( 'It works! However, this app only accepts POST requests for now.' );
};

/**
 * Handles POST requests to the app.
 *
 * @param {express.req} request An Express request. See https://expressjs.com/en/4x/api.html#req.
 * @param {express.res} response An Express response. See https://expressjs.com/en/4x/api.html#res.
 * @return {bool|Promise} Either `false` if the event cannot be handled, or a Promise as returned
 *                        by `handleEvent()`.
 */
const handlePost = ( request, response ) => {
  logRequest( request );

  // Respond to challenge sent by Slack during event subscription set up.
  if ( request.body.challenge ) {
    response.send( request.body.challenge );
    console.info( '200 Challenge response sent' );
    return false;
  }

  // Ensure the verification token in the incoming request is valid.
  const validation = validateToken( request.body.token, SLACK_VERIFICATION_TOKEN );
  if ( true !== validation ) {
    response.status( validation.error ).send( validation.message );
    return false;
  }

  // Send back a 200 OK now so Slack doesn't get upset.
  response.send( '' );

  // Drop retries. This is controversial. But, because we're mainly gonna be running on free Heroku
  // dynos, we'll be sleeping after inactivity. It takes longer than Slack's 3 second limit to start
  // back up again, so Slack will retry immediately and then again in a minute - which will result
  // in the action being carried out 3 times if we listen to it!
  // @see https://api.slack.com/events-api#graceful_retries
  if ( request.headers['x-slack-retry-num']) {
    console.log( 'Skipping Slack retry.' );
    return false;
  }

  // Handle the event now, if it's valid.
  if ( isValidEvent( request.body.event ) ) {
    return handleEvent( request.body.event );
  }

}; // HandlePost.

module.exports = {
  setSlackClient,
  isValidEvent,
  extractEventData,
  respondToUser,
  updateScore,
  handleEvent,
  logRequest,
  validateToken,
  handleGet,
  handlePost
};
