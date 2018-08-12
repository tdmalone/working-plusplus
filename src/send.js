/**
 * Handles sending of messages - i.e. outgoing messages - back to Slack, via Slack's Web API. See
 * also ./events.js, which handles incoming messages from subscribed events.
 *
 * @see https://api.slack.com/web
 */

'use strict';

let slack;

/**
 * Injects the Slack client to be used for all outgoing messages.
 *
 * @param {WebClient} client An instance of Slack's WebClient as documented at
 *                           https://slackapi.github.io/node-slack-sdk/web_api and
 *                           implemented at
 *                           https://github.com/slackapi/node-slack-sdk/blob/master/src/WebClient.ts
 * @returns {void}
 */
const setSlackClient = ( client ) => {
  slack = client;
};

/**
 * Sends a message to a Slack channel.
 *
 * @param {string} text    The message text to send.
 * @param {string} channel The ID of the channel to send the message to.
 * @return {Promise} A Promise to send the message to Slack.
 */
const sendMessage = ( text, channel ) => {

  const payload = {
    channel,
    text
  };

  return new Promise( ( resolve, reject ) => {
    slack.chat.postMessage( payload ).then( ( data ) => {

      if ( ! data.ok ) {
        console.error( 'Error occurred posting response.' );
        return reject();
      }

      resolve();

    });

  }); // Return new Promise.
}; // SendMessage.

module.exports = {
  setSlackClient,
  sendMessage
};
