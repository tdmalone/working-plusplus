/* eslint-disable max-len */
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

const mysql = require( 'mysql' );
const scoresTableName = 'scores';

/* eslint-disable no-process-env */
/* eslint-enable no-process-env */
const mysqlConfig = {
  // eslint-disable-next-line no-process-env
  host: process.env.DATABASE_HOST,
  // eslint-disable-next-line no-process-env
  port: process.env.DATABASE_PORT,
  // eslint-disable-next-line no-process-env
  user: process.env.DATABASE_USER,
  // eslint-disable-next-line no-process-env
  password: process.env.DATABASE_PASSWORD,
  // eslint-disable-next-line no-process-env
  database: process.env.DATABASE_NAME
};

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

  let scores = '';
  await getAllScores().then( function( result ) {
    scores = result;
  });
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
  await createTable();
  await updateExisting( item, operation );
  let finalResult = '';
  await getNewScore( item ).then( function( result ) {
    finalResult = result[0].score;
  }).catch( ( err ) => setImmediate( () => {
    throw err;
  })
  );
  console.log( item + ' now on ' + finalResult );
  return finalResult;

}; // UpdateScore.

/**
 * Selects score for item.
 *
 * @param {string} item
 *   Item to get the score for.
 * @returns {Promise}
 *   The promise.
 */
function getNewScore( item ) {
  return new Promise( function( resolve, reject ) {
    const db = mysql.createConnection( mysqlConfig );
    const inserts = [ scoresTableName, item ];
    const str = 'SELECT score FROM ?? WHERE item = ?;';
    const query = mysql.format( str, inserts );
    console.log( query );
    db.query( query, [ scoresTableName, item ], function( err, result ) {
      if ( err ) {
        console.log( db.sql );
        reject( err );
      } else {
        resolve( result );
      }
    });
  });
}

/**
 * Retrieves all scores for leaderboard.
 *
 * @returns {Promise}
 *   The promise.
 */
function getAllScores() {
  return new Promise( function( resolve, reject ) {
    const db = mysql.createConnection( mysqlConfig );
    const inserts = [ scoresTableName ];
    const str = 'SELECT * FROM ?? ORDER BY score DESC';
    const query = mysql.format( str, inserts );
    console.log( query );
    db.query( query, [ scoresTableName ], function( err, result ) {
      if ( err ) {
        console.log( db.sql );
        reject( err );
      } else {
        resolve( result );
      }
    });
  });
}

/**
 * Inserts or updates score for item.
 *
 * @param {string} item
 *   Item to update.
 * @param {string} operation
 *   Operation to perform.
 * @returns {Promise}
 *   The promise.
 */
function updateExisting( item, operation ) {
  return new Promise( function( resolve, reject ) {
    const db = mysql.createConnection( mysqlConfig );
    const inserts = [ scoresTableName, item ];
    const str = 'INSERT INTO ?? (item, score) VALUES (?,' + operation + '1) ON DUPLICATE KEY UPDATE score = score' + operation + '1';
    const query = mysql.format( str, inserts );
    console.log( query );
    db.query( query, function( err, result ) {
      if ( err ) {
        console.log( db.sql );
        reject( err );
      } else {
        resolve( result );
      }
    });
  });
}

/**
 *
 * Creates table if it does not exist.
 *
 * @returns {Promise}
 *   The promise.
 */
function createTable() {
  return new Promise( function( resolve, reject ) {
    const db = mysql.createConnection( mysqlConfig );
    const inserts = [ scoresTableName ];
    const str = 'CREATE TABLE IF NOT EXISTS ?? (item VARCHAR(255) PRIMARY KEY, score INT);';
    const query = mysql.format( str, inserts );
    console.log( query );
    db.query( query, function( err, result ) {
      if ( err ) {
        reject( err );
      } else {
        resolve( result );
      }
    });
  });
}

module.exports = {
  retrieveTopScores,
  updateScore
};
