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
      slack = require( '@slack/client' ),
      bodyParser = require( 'body-parser' ),
      app = require( './src/app' );

/* eslint-disable no-process-env, no-magic-numbers */
const PORT = process.env.PORT || 80; // Let Heroku set the port.
const SLACK_OAUTH_ACCESS_TOKEN = process.env.SLACK_BOT_USER_OAUTH_ACCESS_TOKEN;
/* eslint-enable no-process-env, no-magic-numbers */

/** Starts the server and bootstraps the app. */
const bootstrap = ( options = {}) => {

  // Allow alternative implementations of both Express and Slack to be passed in.
  const server = options.express || express();
  app.setSlackClient( options.slack || new slack.WebClient( SLACK_OAUTH_ACCESS_TOKEN ) );

  server.use( bodyParser.json() );
  server.enable( 'trust proxy' );
  server.get( '/', app.handleGet );
  server.post( '/', app.handlePost );

  return server.listen( PORT, () => {
    console.log( 'Listening on port ' + PORT + '.' );
  });

};

// If module was called directly, bootstrap now.
if ( require.main === module ) {
  bootstrap();
}

module.exports = bootstrap;
