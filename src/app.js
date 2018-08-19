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

const events = require( './events' ),
      helpers = require( './helpers' ),
      leaderboard = require( './leaderboard' );

// eslint-disable-next-line no-process-env
const SLACK_VERIFICATION_TOKEN = process.env.SLACK_VERIFICATION_TOKEN;

const HTTP_403 = 403,
      HTTP_500 = 500;

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
 * Handles GET requests to the app. At the moment this only really consists of an authenticated
 * view of the full leaderboard.
 *
 * @param {express.req} request An Express request. See https://expressjs.com/en/4x/api.html#req.
 * @param {express.res} response An Express response. See https://expressjs.com/en/4x/api.html#res.
 * @return {void}
 */
const handleGet = async( request, response ) => {
  logRequest( request );

  switch ( request.path.replace( /\/$/, '' ) ) {

    // Full leaderboard. This will only work when a valid, non-expired token and timestamp are
    // provided - the full link can be retrieved by requesting the leaderboard within Slack.
    // TODO: This should probably be split out into a separate function of sorts, like handlePost.
    case '/leaderboard':
      if ( helpers.isTimeBasedTokenStillValid( request.query.token, request.query.ts ) ) {
        response.send( await leaderboard.getForWeb( request ) );
      } else {
        response
          .status( HTTP_403 )
          .send( 'Sorry, this link is no longer valid. Please request a new link in Slack.' );
      }
      break;

    // A simple default GET response is sometimes useful for troubleshooting.
    default:
      response.send( 'It works! However, this app only accepts POST requests for now.' );
      break;

  }

}; // HandleGet.

/**
 * Handles POST requests to the app.
 *
 * @param {express.req} request An Express request. See https://expressjs.com/en/4x/api.html#req.
 * @param {express.res} response An Express response. See https://expressjs.com/en/4x/api.html#res.
 * @return {bool|Promise} Either `false` if the event cannot be handled, or a Promise as returned
 *                        by `events.handleEvent()`.
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

  // Handle the event now. If the event is invalid, this will return false.
  return events.handleEvent( request.body.event, request );

}; // HandlePost.

module.exports = {
  logRequest,
  validateToken,
  handleGet,
  handlePost
};
