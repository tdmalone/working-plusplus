/**
 * Contains assorted helper functions.
 *
 * @author Tim Malone <tdmalone@gmail.com>
 */

'use strict';

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

};

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
const extractPlusMinusEventData = ( text ) => {
  const data = text.match( /@([A-Za-z0-9]+?)>?\s*(\+{2}|-{2}|—{1})/ );

  if ( ! data ) {
    return false;
  }

  return {
    item: data[1],
    operation: data[2].substring( 0, 1 ).replace( '—', '-' )
  };

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
  return item.match( /U[A-Z0-9]{8}/ ) ? '<@' + item + '>' : item;
};

module.exports = {
  extractCommand,
  extractPlusMinusEventData,
  maybeLinkItem
};
