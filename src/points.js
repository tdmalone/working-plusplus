/**
 * All the stuff that handles the giving, taking away, or otherwise querying of points.
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
  const score = dbSelect.rows[0].score;

  console.log( item + ' now on ' + score );
  return score;

}; // UpdateScore.

module.exports = {
  updateScore
};
