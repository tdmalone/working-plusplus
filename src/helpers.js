/**
 * Contains assorted helper functions.
 */

'use strict';

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
const extractEventData = ( ( text ) => {
  const data = text.match( /@([A-Za-z0-9]+?)>?\s*(\+{2}|-{2}|—{1})/ );

  if ( ! data ) {
    return false;
  }

  return {
    item: data[1],
    operation: data[2].substring( 0, 1 ).replace( '—', '-' )
  };

});

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
  extractEventData,
  maybeLinkItem
};
