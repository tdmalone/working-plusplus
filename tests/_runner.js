/**
 * Custom test runner.
 * Primarily used for end-to-end tests but also useful for some integration tests.
 *
 * @author Tim Malone <tdmalone@gmail.com>
 */

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
 * TODO: Convert this to using a config object to make the parameters more flexible.
 *
 * @param {string}          text       Message text to 'send' from a Slack user to the app.
 * @param {callable|string} nextAction Either a string to query the database for as an item, or a
 *                                     function to call to allow the caller to complete the test. If
 *                                     a function, it will be passed `dbClient` as a parameter if it
 *                                     accepts at least one parameter.
 * @param {callable}        callback   When a string is provided for `nextAction`, this parameter
 *                                     becomes the callback, and the callback is provided the result
 *                                     from querying the string for its score in the database.
 * @param {object}          extraBody  Optional. Additional options to merge in to the body of the
 *                                     message sent to Slack.
 * @returns {void}
 */
const runner = async( text, nextAction, callback, extraBody ) => {

  let body = {
    token: SLACK_VERIFICATION_TOKEN,
    event: {
      type: 'message',
      text: text
    }
  };

  if ( 'undefined' !== typeof extraBody ) {
    body = objectAssignDeep( body, extraBody );
  }

  const request = http.request( config.defaultRequestOptions, response => {

    response
      .on( 'data', () => {})
      .on( 'end', async() => {

        // Wait for the operations after the HTTP requests returns to be completed before testing.
        await new Promise( resolve => setTimeout( resolve, HTTP_RETURN_DELAY ) );

        // Allow the next action to be carried out by the caller, passing it an instance of a
        // dbClient if it accepts one.
        if ( nextAction instanceof Function ) {
          return nextAction( nextAction.length ? await postgres.connect() : null );
        }

        // Otherwise, carry out and return the query result ourselves.
        const dbClient = await postgres.connect();
        const query = await dbClient.query(
          'SELECT score FROM ' + config.scoresTableName + ' WHERE item = \'' + nextAction + '\''
        );

        dbClient.release();
        callback( query.rows[0].score );

      }); // Response end.
  }); // Http.request.

  request.write( JSON.stringify( body ) );
  request.end();

}; // Runner.

module.exports = runner;
