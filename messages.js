/**
 * Provides messages for random selection.
 *
 * TODO: Add the ability to customise these messages - probably via JSON objects in environment
 *       variables.
 */

const operation = require('./operations');

module.exports = {};

module.exports[operation.PLUS] = [
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

module.exports[operation.MINUS] = [
  "Oh RLY?",
  "Oh, really?",
  "Oh :slightly_frowning_face:.",
  "I see.",
  "Ouch.",
  "Oh là là.",
  "Oh.",
  "Condolences."
];

module.exports[operation.SELF] = [
  "Hahahahahahaha no.",
  "Nope.",
  "No. Just no.",
  "Not cool!"
];
