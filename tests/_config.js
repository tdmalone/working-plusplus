/**
 * Shared configuration for tests.
 */

'use strict';

const PORT = process.env.PORT || 80,
      DATABASE_URL = process.env.DATABASE_URL,
      DATABASE_USE_SSL = 'false' === process.env.DATABASE_USE_SSL ? false : true;

module.exports = {

  PORT: PORT,

  scoresTableName: 'scores',

  postgresPoolConfig: {
    connectionString: DATABASE_URL,
    ssl: DATABASE_USE_SSL
  },

  defaultRequestOptions: {
    host: 'localhost',
    method: 'POST',
    port: PORT,
    headers: { 'Content-Type': 'application/json' }
  }

};
