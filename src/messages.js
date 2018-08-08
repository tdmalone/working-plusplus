/**
 * Provides messages for random selection.
 *
 * TODO: Add the ability to customise these messages - probably via JSON objects in environment
 *       variables.
 */

'use strict';

const operation = require('./operations');

const messages = {};

messages[operation.PLUS] = [
  "Congrats!",
  "Got it!",
  "Bravo.",
  "Oh well done.",
  "Nice work!",
  "Well done.",
  "Exquisite.",
  "Lovely.",
  "Superb.",
  "Classic!",
  "Charming.",
  "Noted.",
  "Well, well!",
  "Well played.",
  "Sincerest congratulations.",
  "Delicious."
];

messages[operation.MINUS] = [
  "Oh RLY?",
  "Oh, really?",
  "Oh :slightly_frowning_face:.",
  "I see.",
  "Ouch.",
  "Oh là là.",
  "Oh.",
  "Condolences."
];

messages[operation.SELF] = [
  "Hahahahahahaha no.",
  "Nope.",
  "No. Just no.",
  "Not cool!"
];

/**
 * Retrieves a random message from the given pool of messages.
 *
 * @param {string} operation The name of the operation to retrieve potential messages for. Accepts
 *                           'plus', 'minus', and 'selfPlus', as well as the shorthand '+' and '-'.
 * @returns {string} A random message from the chosen pool.
 */
const getRandomMessage = ( op, item, score ) => {
  var format = "";

  switch(op) {
    case operation.MINUS:
    case operation.PLUS:
      format = "<message> *<item>* is now on <score> point<plural>.";
      break;

    case operation.SELF:
    default:
    format = "<item> <message>";
      break;
  }

  var plural = score == Math.abs( 1 ) ? "" : "s";

  var max = messages[ op ].length - 1;
  var random = Math.floor( Math.random() * max );
  var message = messages[ op ][ random ];

  var formattedMessage = format.replace("<item>", item)
    .replace("<score>", score)
    .replace("<plural>", plural)
    .replace("<message>", message);

   return formattedMessage;

}

module.exports = {
  getRandomMessage: getRandomMessage
};
