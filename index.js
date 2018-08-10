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
      slackClient = require( '@slack/client' ),
      bodyParser = require( 'body-parser' ),
      app = require( './src/app' );

/* eslint-disable no-process-env, no-magic-numbers */
const PORT = process.env.PORT || 80; // Let Heroku set the port.
const SLACK_OAUTH_ACCESS_TOKEN = process.env.SLACK_BOT_USER_OAUTH_ACCESS_TOKEN;
/* eslint-enable no-process-env, no-magic-numbers */

const server = express();

app.setSlackClient( new slackClient.WebClient( SLACK_OAUTH_ACCESS_TOKEN ) );

server.use( bodyParser.json() );
server.enable( 'trust proxy' );
server.get( '/', app.handleGet );
server.post( '/', app.handlePost );

const listener = server.listen( PORT, () => {
  console.log( 'Listening on port ' + PORT + '.' );
});

module.exports = {
  server: server,
  listener: listener
};
