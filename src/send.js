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
 * @param {string|Object} text    Either message text to send, or a Slack message payload. See the
 *                                docs at https://api.slack.com/methods/chat.postMessage and
 *                                https://api.slack.com/docs/message-formatting.
 * @param {string}        channel The ID of the channel to send the message to. Can alternatively
 *                                be provided as part of the payload in the previous argument.
 * @return {Promise} A Promise to send the message to Slack.
 */
const sendMessage = ( text, channel ) => {

  let payload = {
    channel,
    text
  };

  // If 'text' was provided as an object instead, merge it into the payload.
  if ( 'object' === typeof text ) {
    delete payload.text;
    payload = Object.assign( payload, text );
  }

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
