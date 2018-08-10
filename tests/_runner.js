/**
 * Custom test runner.
 * Primarily used for end-to-end tests but also useful for some integration tests.
 *
 * @author Tim Malone <tdmalone@gmail.com>
 */

'use strict';

const config = require( './_config' ),
      http = require( 'http' ),
      pg = require( 'pg' );

const SLACK_VERIFICATION_TOKEN = process.env.SLACK_VERIFICATION_TOKEN;

// Time (in ms) that we should wait after HTTP requests return, before testing any of the results.
const HTTP_RETURN_DELAY = 100;

const postgres = new pg.Pool( config.postgresPoolConfig );

/**
 * Encapsulates all the boilerplate required to run the full request cycle for end-to-end tests.
 * @param {string}          text       Message text to 'send' from a Slack user to the app.
 * @param {callable|string} nextAction Either a string to query the database for as an item, or a
 *                                     function to call to allow the caller to complete the test. If
 *                                     a function, it will be passed `dbClient` as a parameter.
 * @param {callable}        callback   When a string is provided for `nextAction`, this parameter
 *                                     becomes the callback, and the callback is provided the result
 *                                     from querying the string for its score in the database.
 * @returns {void}
 */
const runner = async( text, nextAction, callback ) => {

  const body = {
    token: SLACK_VERIFICATION_TOKEN,
    event: {
      type: 'message',
      text: text
    }
  };

  const request = http.request( config.defaultRequestOptions, response => {
    let data = '';

    response.on( 'data', chunk => {
      data += chunk;
    }).on( 'end', async() => {

      console.log( data );

      // Wait for the operations after the HTTP requests returns to be completed before testing.
      setTimeout( async() => {
        const dbClient = await postgres.connect();

        // Return for the next action to be carried out by the caller.
        if ( nextAction instanceof Function ) {
          return nextAction( dbClient );
        }

        // Otherwise, carry out and return the query result ourselves.
        const query = await dbClient.query(
          'SELECT score FROM ' + config.scoresTableName + ' WHERE item = \'' + nextAction + '\''
        );

        dbClient.release();
        callback( query.rows[0].score );

      }, HTTP_RETURN_DELAY );
    }); // Response end.
  }); // Http.request.

  request.write( JSON.stringify( body ) );
  request.end();

}; // Runner.

module.exports = runner;
