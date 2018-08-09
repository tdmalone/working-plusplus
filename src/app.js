/**
 * Working PlusPlus++
 * Like plusplus.chat, but one that actually works, because you can host it yourself! 😉
 *
 * @see https://github.com/tdmalone/working-plusplus
 * @see https://api.slack.com/events-api
 * @see https://expressjs.com/en/4x/api.html
 * @author Tim Malone <tdmalone@gmail.com>
 */

'use strict';

const slackClient = require( '@slack/client' ),
      pg = require( 'pg' ),
      { getRandomMessage } = require( './messages' ),
      operations = require( './operations' );

// Get environment variables.
/* eslint-disable no-process-env */
const SLACK_OAUTH_ACCESS_TOKEN = process.env.SLACK_BOT_USER_OAUTH_ACCESS_TOKEN,
      SLACK_VERIFICATION_TOKEN = process.env.SLACK_VERIFICATION_TOKEN,
      DATABASE_URL = process.env.DATABASE_URL;
/* eslint-enable no-process-env */

const HTTP_403 = 403,
      HTTP_500 = 500,
      scoresTableName = 'scores',
      postgresPoolConfig = {
        connectionString: DATABASE_URL,
        ssl:              true
      };

const postgres = new pg.Pool( postgresPoolConfig ),
      slack = new slackClient.WebClient( SLACK_OAUTH_ACCESS_TOKEN );

/** Determines whether or not events sent from Slack can be handled by this app. */
const isValidEvent = ( event ) =>{

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

/** Handles events sent from Slack. */
const handleEvent = async( event ) => {
  var operation;

  // Drop events where the text that doesn't mention anybody/anything.
  if ( -1 === event.text.indexOf( '@' ) ) {
    return false;
  }

  // Drop events where the text doesn't include a valid operation.

  const validOperations = [
    '++',
    '--',
    '—' // Supports iOS' automatic replacement of --.
  ];

  if ( ! validOperations.some( element => -1 !== event.text.indexOf( element ) ) ) {
    return false;
  }

  // If we're still here, it's a message to deal with!

  // Get the user or 'thing' that is being spoken about, and the 'operation' being done on it.
  // We take the operation down to one character, and also support — due to iOS' replacement of --.
  const data = event.text.match( /@([A-Za-z0-9.\-_]*?)>?\s*([-+]{2}|—{1})/ );
  const item = data[1];
  operation = data[2].substring( 0, 1 ).replace( '—', '-' );

  // If we somehow didn't get anything, drop it. This can happen when eg. @++ is typed.
  if ( ! item.trim() ) {
    return false;
  }

  // If the user is trying to ++ themselves...
  if ( item === event.user && '+' === operation ) {

    const message = getRandomMessage( operations.SELF, '<@' + event.user + '>', 0 );

    slack.chat.postMessage({
      channel: event.channel,
      text:    message
    }).then( ( data ) => {
      console.log(
        data.ok ?
          item + ' tried to alter their own score.' :
          'Error occurred posting response to user altering their own score.'
      );
    });

    return false;

  } // If self ++.

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
  const score = dbSelect.rows[0].score;

  dbClient.release();

  // Respond.

  const itemMaybeLinked = item.match( /U[A-Z0-9]{8}/ ) ? '<@' + item + '>' : item;
  operation = operation.replace( '+', operations.PLUS ).replace( '-', operations.MINUS );
  const message = getRandomMessage( operation, itemMaybeLinked, score );

  slack.chat.postMessage({
    channel: event.channel,
    text:    message
  }).then( ( data ) => {
    console.log( data.ok ? item + ' now on ' + score : 'Error occurred posting response.' );
  });

}; // HandleEvent.

/** Handles GET requests to the app. */
const handleGet = ( request, response ) => {
  response.send( 'It works! However, this app only accepts POST requests for now.' );
};

/** Handles POST requests to the app. */
const handlePost = ( request, response ) => {

  // Simple logging of requests.
  console.log(
    request.ip + ' ' + request.method + ' ' + request.path + ' ' + request.headers['user-agent']
  );

  // Respond to challenge sent by Slack during event subscription set up.
  if ( request.body.challenge ) {
    response.send( request.body.challenge );
    console.info( '200 Challenge response sent' );
    return;
  }

  // Sanity check for bad verification values - empty, or still set to the default.
  if ( ! SLACK_VERIFICATION_TOKEN || 'xxxxxxxxxxxxxxxxxxxxxxxx' === SLACK_VERIFICATION_TOKEN ) {
    response.status( HTTP_500 ).send( 'Internal server error.' );
    console.error( '500 Internal server error - bad verification value' );
    return;
  }

  // Check that this is Slack making the request.
  // TODO: Move to calculating the signature instead (newer, more secure method).
  if ( SLACK_VERIFICATION_TOKEN !== request.body.token ) {
    response.status( HTTP_403 ).send( 'Access denied.' );
    console.error( '403 Access denied - incorrect verification token' );
    return;
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
    return;
  }

  // Handle the event now, if it's valid.
  if ( isValidEvent( request.body.event ) ) {
    handleEvent( request.body.event );
  }

}; // HandlePost.

module.exports = {
  isValidEvent: isValidEvent,
  handleEvent:  handleEvent,
  handleGet:    handleGet,
  handlePost:   handlePost
};
