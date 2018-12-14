/**
 * Contains assorted helper functions.
 *
 * @author Tim Malone <tdmalone@gmail.com>
 */

'use strict';

const slack = require( './slack' );

const fs = require( 'fs' ),
      crypto = require( 'crypto' ),
      handlebars = require( 'handlebars' );

const templates = {};

/* eslint-disable no-process-env */
const envSecret1 = process.env.SLACK_VERIFICATION_TOKEN,
      envSecret2 = process.env.DATABASE_URL;
/* eslint-enable no-process-env */

const ONE_DAY = 60 * 60 * 24, // eslint-disable-line no-magic-numbers
      TOKEN_TTL = ONE_DAY,
      MILLISECONDS_TO_SECONDS = 1000;

/**
 * Given a message and a list of commands, extracts the first command mentioned in the message.
 *
 * TODO: May need to ensure that commands are whole words, so a smaller command doesn't get
 *       detected inside a larger one.
 *
 * @param {string} message  The message text to search.
 * @param {array}  commands The commands to look for.
 * @return {string|Boolean} Either the first command found, or false if no commands were found.
 */
const extractCommand = ( message, commands ) => {

  let firstLocation = Number.MAX_SAFE_INTEGER,
      firstCommand;

  for ( const command of commands ) {
    const location = message.indexOf( command );
    if ( -1 !== location && location < firstLocation ) {
      firstLocation = location;
      firstCommand = command;
    }
  }

  return firstCommand ? firstCommand : false;

}; // ExtractCommand.

/**
 * Gets the user or 'thing' that is being spoken about, and the 'operation' being done on it.
 * We take the operation down to one character, and also support — due to iOS' replacement of --.
 *
 * @param {string} text The message text sent through in the event.
 * @returns {object} An object containing both the 'item' being referred to - either a Slack user
 *                   ID (eg. 'U12345678') or the name of a 'thing' (eg. 'NameOfThing'); and the
 *                   'operation' being done on it - expressed as a valid mathematical operation
 *                   (i.e. + or -).
 */

const extractPlusMinusEventData = (text) => {

  const data = text.match(/@([A-Za-z0-9:-_]+?)>?\s*(\+{2}|-{2}|—{1}|={2}|#{2})/);


  if (!data) {
    return false;
  }

  if ('##' === data[2]) {
    var ops = ['+', '-'];
    var item = ops[Math.floor(Math.random() * ops.length)];
    return {
      item: data[1].toUpperCase(),
      operation: item
    };
  } else {
    return {
      item: data[1].toUpperCase(),
      operation: data[2].substring(0, 1).replace('—', '-')
    };
  }
}; // ExtractPlusMinusEventData.

/**
 * Extracts a valid Slack user ID from a string of text.
 *
 * @param {string} text The string in question.
 * @returns {string} The first matched Slack user ID in the string, or an empty string if a match
 *                   could not be found.
 * @see ::isUser
 */
const extractUserID = ( text ) => {
  const match = text.match( /U[A-Z0-9]{8}/ );
  return match ? match[0] : '';
};

/**
 * Generates a time-based token based on secrets from the environment.
 *
 * @param {string} ts A timestamp to hash into the token.
 * @returns {string} A token, that can be re-checked later using the same timestamp.
 */
const getTimeBasedToken = ( ts ) => {

  if ( ! ts ) {
    throw Error( 'Timestamp not provided when getting time-based token.' );
  }

  return crypto
    .createHmac( 'sha256', envSecret1 )
    .update( ts + envSecret2 )
    .digest( 'hex' );
};

/**
 * Returns the current time as a standard Unix epoch timestamp.
 *
 * @returns {integer} The current Unix timestamp.
 */
const getTimestamp = () => {
  return Math.floor( Date.now() / MILLISECONDS_TO_SECONDS );
};

/**
 * Determines whether or not a number should be referred to as a plural - eg. anything but 1 or -1.
 *
 * @param {integer} number The number in question.
 * @returns {Boolean} Whether or not the number is a plural.
 */
const isPlural = ( number ) => {
  return 1 !== Math.abs( number );
};

/**
 * Validates a time-based token to ensure it is both still valid, and that it can be successfully
 * re-hashed using the expected secrets.
 *
 * @param {string}  token The token to validate.
 * @param {integer} ts    The timestamp the token was supplied with.
 * @returns {boolean} Whether or not the token is valid.
 */
const isTimeBasedTokenStillValid = ( token, ts ) => {
  const now = getTimestamp();

  // Don't support tokens too far from the past.
  if ( now > parseInt( ts ) + TOKEN_TTL ) {
    return false;
  }

  // Don't support tokens from the future.
  if ( now < ts ) {
    return false;
  }

  const hash = getTimeBasedToken( ts );

  if ( hash !== token ) {
    return false;
  }

  return true;
};

/**
 * Determines whether or not a string represents a Slack user ID - eg. U12345678.
 *
 * @param {string} item The string in question.
 * @returns {Boolean} Whether or not the string is a Slack user ID.
 * @see ::extractUserID()
 */
const isUser = ( item ) => {
  return item.match( /U[A-Z0-9]{8}/ ) ? true : false;
};

/**
 * Takes an item and returns it maybe linked using Slack's 'mrkdwn' format (their own custom
 * version of markdown).
 *
 * @param {string} item A raw 'item' - either a Slack user ID, or the name of a 'thing'.
 * @return {string} The item linked with Slack mrkdwn
 * @see https://api.slack.com/docs/message-formatting#linking_to_channels_and_users
 */
const maybeLinkItem = ( item ) => {
  return isUser( item ) ? '<@' + item + '>' : item;
};

/**
 * Renders HTML for the browser, using Handlebars. Includes a standard header and footer.
 *
 * @param {string} templatePath Path to the Handlebars-compatible template file to render; that is,
 *                              a file containing valid HTML, with variable interpolations as
 *                              required. The path should be relative to the app's entry-point
 *                              (which is usually an index.js in the root of the repository).
 * @param {object} context      The Handlebars-compatible context to render; that is, an object with
 *                              values for the variables referenced in the template. Also include
 *                              standard variables referenced in the header and footer, such as
 *                              'title'. See the contents of ./html/ for more details. Some
 *                              variables may have defaults provided, which can be overridden.
 * @param {object} request      Optional. The Express request object that resulted in this
 *                              rendering job being run. Can be used to provide additional context
 *                              to the templates.
 * @returns {string} HTML ready to be rendered in the browser.
 * @see https://handlebarsjs.com/
 */
const render = async( templatePath, context = {}, request = {}) => {

  // Retrieve the header and footer HTML, if we don't already have it in memory.
  if ( ! templates.header ) templates.header = fs.readFileSync( 'src/html/header.html', 'utf8' );
  if ( ! templates.footer ) templates.footer = fs.readFileSync( 'src/html/footer.html', 'utf8' );

  // Retrieve the requested template HTML if it is not already in memory.
  if ( ! templates[ templatePath ]) {
    console.log( 'Retrieving template ' + templatePath + '.' );
    templates[ templatePath ] = fs.readFileSync( templatePath, 'utf8' );
  }

  /* eslint-disable camelcase */ // Handlebars templates commonly use snake_case instead.
  const defaults = {
    site_title: (
      request.query.botUser ?
        await slack.getUserName( request.query.botUser ) :
        'Working PlusPlus++'
    )
  };
  /* eslint-enable camelcase */

  const output = templates.header + templates[ templatePath ] + templates.footer;
  return handlebars.compile( output )( Object.assign( defaults, context ) );

}; // Render.

module.exports = {
  extractCommand,
  extractPlusMinusEventData,
  extractUserID,
  getTimeBasedToken,
  getTimestamp,
  isPlural,
  isTimeBasedTokenStillValid,
  isUser,
  maybeLinkItem,
  render
};
