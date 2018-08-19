/**
 * Custom test runner that makes an HTTP request to the app and facilitates checking the outcome.
 * Used for end-to-end testing.
 *
 * @author Tim Malone <tdmalone@gmail.com>
 */

/* global jest */

'use strict';

const objectAssignDeep = require( 'object-assign-deep' ),
      config = require( './_config' ),
      http = require( 'http' ),
      pg = require( 'pg' );

const SLACK_VERIFICATION_TOKEN = process.env.SLACK_VERIFICATION_TOKEN;

// Time (in ms) that we should wait after HTTP requests return, before testing any of the results.
const HTTP_RETURN_DELAY = 100;

const postgres = new pg.Pool( config.postgresPoolConfig );

/**
 * Encapsulates all the boilerplate required to run the full request cycle for end-to-end tests.
 *
 * @param {string}          text     Message text to simulate sending from a Slack user to the app.
 * @param {callable|object} options  Optionally, an object with one or more properties that control
 *                                   how the runner works. Alternatively, supply the next parameter,
 *                                   the callback function, here instead. Valid properties are:
 *                                     - itemToCheck: The name of an item to query the database for
 *                                                    after the message has been simulated. The
 *                                                    score will be sent as the single argument to
 *                                                    the callback function. If no entry exists,
 *                                                    `false` is sent instead.
 *                                     - extraBody:   An object containing additional parameters for
 *                                                    the event body. Will be deep merged into the
 *                                                    default body provided by this function.
 * @param {callable|string} callback Required. A function to call on completion of the run.
 *                                   Suppliable as the preceding parameter if that parameter is not
 *                                   needed. If `itemToCheck` is provided in `config`, this function
 *                                   will receive the result. Otherwise, if this function accepts at
 *                                   least one parameter, it will be passed an active `dbClient` to
 *                                   to allow it to make its own checks.
 * @returns {void}
 */
const runner = async( text, options, callback ) => {

  // Allow the callback to be optionally provided as the second parameter.
  if ( options instanceof Function ) {
    callback = options; // eslint-disable-line no-param-reassign
  }

  let body = {
    token: SLACK_VERIFICATION_TOKEN,
    event: {
      type: 'message',
      text
    }
  };

  if ( 'undefined' !== typeof options.extraBody ) {
    body = objectAssignDeep( body, options.extraBody );
  }

  const request = http.request( config.defaultRequestOptions, ( response ) => {

    response
      .on( 'data', () => {})
      .on( 'end', async() => {

        // Wait for the operations after the HTTP requests returns to be completed before testing.
        await new Promise( ( resolve ) => setTimeout( resolve, HTTP_RETURN_DELAY ) );

        // If we weren't provided with an itemToCheck, return to the callback now, passing it an
        // instance of a dbClient if it accepts at least one argument.
        if ( 'undefined' === typeof options.itemToCheck ) {
          return callback( callback.length ? await postgres.connect() : null );
        }

        // Otherwise, carry out the query ourselves and then return the result.
        const dbClient = await postgres.connect();
        const query = await dbClient.query(
          'SELECT score FROM ' + config.scoresTableName + ' ' +
          'WHERE item = \'' + options.itemToCheck + '\''
        );

        await dbClient.release();
        callback( query.rows.length ? query.rows[0].score : false );

      }); // Response end.
  }); // Http.request.

  request.write( JSON.stringify( body ) );
  request.end();

}; // Runner.

module.exports = runner;
