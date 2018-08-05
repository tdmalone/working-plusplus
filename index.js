/**
 * Working PlusPlus++
 * Like plusplus.chat, but one that actually works, because you can host it yourself! 😉
 *
 * @see https://github.com/tdmalone/working-plusplus
 * @see https://api.slack.com/events-api
 * @author Tim Malone <tdmalone@gmail.com>
 */

const express = require( 'express' ),
      bodyParser = require( 'body-parser' ),
      slackClient = require('@slack/client'),
      pg = require( 'pg' );

const SLACK_BOT_USER_OAUTH_ACCESS_TOKEN = process.env.SLACK_BOT_USER_OAUTH_ACCESS_TOKEN,
      SLACK_VERIFICATION_TOKEN = process.env.SLACK_VERIFICATION_TOKEN,
      DATABASE_URL = process.env.DATABASE_URL;

// Let Heroku set the port.
const PORT = process.env.PORT || 80;

const scoresTableName = 'scores';

const app = express(),
      postgres = new pg.Pool({ connectionString: DATABASE_URL, ssl: true }),
      slack = new slackClient.WebClient( SLACK_BOT_USER_OAUTH_ACCESS_TOKEN );

app.use( bodyParser.json() );
app.enable( 'trust proxy' );

app.get( '/', ( request, response ) => {
  response.send( 'It works! However, this app only accepts POST requests for now.' );
});

app.post( '/', async ( request, response ) => {

  console.log(
    request.ip + ' ' + request.method + ' ' + request.path + ' ' + request.headers['user-agent']
  );

  // Respond to challenge sent by Slack during event subscription set up.
  if ( request.body.challenge ) {
    response.send( request.body.challenge );
    console.info( '200 Challenge response sent' );
    return;
  }

  // Sanity check for bad verification values.
  if ( ! SLACK_VERIFICATION_TOKEN || 'xxxxxxxxxxxxxxxxxxxxxxxx' === SLACK_VERIFICATION_TOKEN ) {
    response.status( 403 ).send( 'Access denied.' );
    console.error( '403 Access denied - bad verification value' );
    return;
  }

  // Check that this is Slack making the request.
  // TODO: Move to calculating the signature instead (newer, more secure method).
  if ( SLACK_VERIFICATION_TOKEN !== request.body.token ) {
    response.status( 403 ).send( 'Access denied.' );
    console.error( '403 Access denied - incorrect verification token' );
    return;
  }

  // Send back a 200 OK now so Slack doesn't get upset.
  response.send( '' );

  const event = request.body.event;

  // Drop events that aren't messages, or that don't have message text.
  if ( 'message' !== event.type || ! event.text ) {
    console.warn( 'Invalid event received (' + request.event.type + ') or event data missing' );
    return;
  }

  // Drop retries. This is controversial. But, because we're mainly gonna be running on free Heroku
  // dynos, we'll be sleeping after inactivity. It takes longer than Slack's 3 second limit to start
  // back up again, so Slack will retry immediately and then again in a minute - which will result
  // in the action being carried out 3 times if we listen to it!
  // @see https://api.slack.com/events-api#graceful_retries
  if ( request.headers['X-Slack-Retry-Num'] ) {
    return;
  }

  const text = event.text;

  // Drop text that doesn't mention anybody/anything.
  if ( -1 === text.indexOf( '@' ) ) {
    return;
  }

  // Drop text that doesn't include ++ or -- (or —, to support iOS replacing --).
  if ( -1 === text.indexOf( '++' ) && -1 === text.indexOf( '--' ) && -1 === text.indexOf( '—' ) ) {
    return;
  }

  // If we're still here, it's a message to deal with!

  // Get the user or 'thing' that is being spoken about, and the 'operation' being done on it.
  // We take the operation down to one character, and also support — due to iOS' replacement of --.
  const data = text.match( /@([A-Za-z0-9\.\-_]*?)>?\s*([\-+]{2}|—{1})/ );
  const item = data[1];
  const operation = data[2].substring( 0, 1 ).replace( '—', '-' );

  // If we somehow didn't get anything, drop it. This can happen when eg. @++ is typed.
  if ( ! item.trim() ) {
    return;
  }

  // If the user is trying to ++ themselves...
  if ( item === event.user && '+' === operation ) {

    slack.chat.postMessage({
      channel: event.channel,
      text: 'Ah nope! Not cool <@' + event.user + '>!'
    }).then( ( data ) => {
      console.log(
        data.ok ?
          item + ' tried to alter their own score.' :
          'Error occurred posting response to user altering their own score.'
      );
    });

    return;

  }

  // Connect to the DB, and create a table if it's not yet there.
  const dbClient = await postgres.connect();
  const dbCreateResult = await dbClient.query( 'CREATE EXTENSION IF NOT EXISTS citext; CREATE TABLE IF NOT EXISTS ' + scoresTableName + ' (item CITEXT PRIMARY KEY, score INTEGER);' );

  // Atomically record the action.
  // TODO: Fix potential SQL injection issues here, even though we know the input should be safe.
  const dbInsert = await dbClient.query( 'INSERT INTO ' + scoresTableName + ' VALUES (\'' + item + '\', ' + operation + '1) ON CONFLICT (item) DO UPDATE SET score = ' + scoresTableName + '.score ' + operation + ' 1;' );

  // Get the new value.
  // TODO: Fix potential SQL injection issues here, even though we know the input should be safe.
  const dbSelect = await dbClient.query( 'SELECT score FROM ' + scoresTableName + ' WHERE item = \'' + item + '\';' );
  const score = dbSelect.rows[0].score;

  dbClient.release();

  // Respond.
  // TODO: Add some much better messages here! And also the ability to customise them - probably
  //       via JSON objects in environment variables.
  const itemMaybeLinked = item.match( /U[A-Z0-9]{8}/ ) ? '<@' + item + '>' : item;
  slack.chat.postMessage({
    channel: event.channel,
    text: 'Heard ya loud and clear! *' + itemMaybeLinked + '* is now on ' + score + '.'
  }).then( ( data ) => {
    console.log( data.ok ? item + ' now on ' + score : 'Error occurred posting response.' );
  });

});

app.listen( PORT, () => {
  console.log( 'Listening on port ' + PORT + '.' )
});
