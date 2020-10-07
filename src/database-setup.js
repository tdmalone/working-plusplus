/* eslint-disable max-len */
'use strict';
require( 'dotenv' ).config();
const mysql = require( 'mysql' );

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
console.log( mysqlConfig );

/**
 *
 * Prepares database.
 *
 * @returns {Promise}
 *   The promise.
 */
const prepareDatabase = async() => {
  await createUserTable();
  await createChannelTable();
  await createScoreTable();

  console.log( 'Database prepared!' );
};

/**
 * Creates channel table.
 *
 * @returns {Promise}
 *   Returned promise.
 */
function createChannelTable() {
  return new Promise( function( resolve, reject ) {
    const db = mysql.createConnection( mysqlConfig );
    const inserts = [ 'channel' ];
    const str = 'CREATE TABLE IF NOT EXISTS ?? ' +
        '(`channel_id` VARCHAR(255) NOT NULL,' +
        '`channel_name` VARCHAR(255) NULL,' +
        'PRIMARY KEY (`channel_id`));';
    const query = mysql.format( str, inserts );
    db.query( query, function( err, result ) {
      if ( err ) {
        reject( err );
      } else {
        resolve( result );
      }
    });
  });
}

/**
 * Creates scores table.
 *
 * @returns {Promise}
 *   Returned promise.
 */
function createScoreTable() {
  return new Promise( function( resolve, reject ) {
    const db = mysql.createConnection( mysqlConfig );
    const inserts = [ 'score' ];
    const str = 'CREATE TABLE IF NOT EXISTS ?? (`score_id` VARCHAR(255) NOT NULL, `timestamp` DATETIME NOT NULL, `to_user_id` VARCHAR(255) NOT NULL, `from_user_id` VARCHAR(255) NOT NULL, `channel_id` VARCHAR(255) NOT NULL, `description` TEXT NULL, PRIMARY KEY (`score_id`), INDEX `fk_score_user_idx` (`to_user_id` ASC) VISIBLE, INDEX `fk_score_user1_idx` (`from_user_id` ASC) VISIBLE, INDEX `fk_score_channel1_idx` (`channel_id` ASC) VISIBLE, CONSTRAINT `fk_score_user` FOREIGN KEY (`to_user_id`) REFERENCES `agilekarma`.`user` (`user_id`) ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT `fk_score_user1` FOREIGN KEY (`from_user_id`) REFERENCES `agilekarma`.`user` (`user_id`) ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT `fk_score_channel1` FOREIGN KEY (`channel_id`) REFERENCES `agilekarma`.`channel` (`channel_id`) ON DELETE NO ACTION ON UPDATE NO ACTION)';
    const query = mysql.format( str, inserts );
    db.query( query, function( err, result ) {
      if ( err ) {
        reject( err );
      } else {
        resolve( result );
      }
    });
  });
}

/**
 * Creates user table.
 *
 * @returns {Promise}
 *   Returned promise.
 */
function createUserTable() {
  return new Promise( function( resolve, reject ) {
    const db = mysql.createConnection( mysqlConfig );
    const inserts = [ 'user' ];
    const str = 'CREATE TABLE IF NOT EXISTS ?? ' +
        '(`user_id` VARCHAR(255) NOT NULL,' +
        '`banned_until` DATETIME NULL,' +
        'PRIMARY KEY (`user_id`));';
    const query = mysql.format( str, inserts );
    db.query( query, function( err, result ) {
      if ( err ) {
        reject( err );
      } else {
        resolve( result );
      }
    });
  });
}
prepareDatabase().catch( function( reason ) {
  console.log( reason );
});
