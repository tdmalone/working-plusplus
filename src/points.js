/**
 * All the stuff that handles the giving, taking away, or otherwise querying of points.
 *
 * NOTE: As the functions here pretty much deal exclusively with the database, they generally
 *       aren't unit tested, as that would require anyone who runs the tests to also have a Postgres
 *       server. Instead, the functions in this file are well covered via the integration and
 *       end-to-end tests.
 *
 * @author Tim Malone <tdmalone@gmail.com>
 */

'use strict';

const pg = require( 'pg' );

/* eslint-disable no-process-env */
const DATABASE_URL = process.env.DATABASE_URL,
      DATABASE_USE_SSL = 'false' === process.env.DATABASE_USE_SSL ? false : true;
/* eslint-enable no-process-env */

const scoresTableName = 'scores',
      postgresPoolConfig = {
        connectionString: DATABASE_URL,
        ssl: DATABASE_USE_SSL
      };

const postgres = new pg.Pool( postgresPoolConfig );

/**
 * Retrieves all scores from the database, ordered from highest to lowest.
 *
 * TODO: Add further smarts to retrieve only a limited number of scores, to avoid having to query
 *       everything. Note that this isn't just LIMIT, because we'll need to apply the limit
 *       separately to both users (/U[A-Z0-9]{8}/) and things (everything else) & return both sets.
 *
 * @return {array} An array of entries, each an object containing 'item' (string) and 'score'
 *                (integer) properties.
 */
const retrieveTopScores = async() => {

  const query = 'SELECT * FROM ' + scoresTableName + ' ORDER BY score DESC';

  const dbClient = await postgres.connect(),
        result = await dbClient.query( query ),
        scores = result.rows;

  await dbClient.release();

  return scores;

};

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

  await dbClient.release();
  const score = dbSelect.rows[0].score;

  console.log( item + ' now on ' + score );
  return score;

}; // UpdateScore.

module.exports = {
  retrieveTopScores,
  updateScore
};
