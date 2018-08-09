/**
 * Working PlusPlus++
 * Like plusplus.chat, but one that actually works, because you can host it yourself! 😉
 *
 * @see https://github.com/tdmalone/working-plusplus
 * @see https://expressjs.com/en/4x/api.html
 * @author Tim Malone <tdmalone@gmail.com>
 */

'use strict';

const express = require( 'express' ),
      bodyParser = require( 'body-parser' ),
      app = require( './src/app' );

// Let Heroku set the port.
const PORT = process.env.PORT || 80; // eslint-disable-line no-process-env, no-magic-numbers

const server = express();

server.use( bodyParser.json() );
server.enable( 'trust proxy' );
server.get( '/', app.handleGet );
server.post( '/', app.handlePost );

const listener = server.listen( PORT, () => {
  console.log( 'Listening on port ' + PORT + '.' );
});

module.exports = {
  server:   server,
  listener: listener
};
