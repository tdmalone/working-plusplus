/**
 * Provides messages for random selection.
 *
 * TODO: Add the ability to customise these messages - probably via JSON objects in environment
 *       variables.
 */

'use strict';

const operation = require( './operations' );

const messages = {};

messages[operation.PLUS] = [ {
  'probability': 100,
  'set':         [
    'Congrats!',
    'Got it!',
    'Bravo.',
    'Oh well done.',
    'Nice work!',
    'Well done.',
    'Exquisite.',
    'Lovely.',
    'Superb.',
    'Classic!',
    'Charming.',
    'Noted.',
    'Well, well!',
    'Well played.',
    'Sincerest congratulations.',
    'Delicious.'
  ]
} ];

messages[operation.MINUS] = [ {
  'probability': 100,
  'set':         [
    'Oh RLY?',
    'Oh, really?',
    'Oh :slightly_frowning_face:.',
    'I see.',
    'Ouch.',
    'Oh là là.',
    'Oh.',
    'Condolences.'
  ]
} ];

messages[operation.SELF] = [ {
  'probability': 100,
  'set':         [
    'Hahahahahahaha no.',
    'Nope.',
    'No. Just no.',
    'Not cool!'
  ]
} ];

/**
 * Retrieves a random message from the given pool of messages.
 *
 * @param {string}  op    The name of the operation to retrieve potential messages for.
 *                        See operations.js
 * @param {string}  item  The subject of the message, either "<@user>" or "object".
 * @param {integer} score The item's current score
 *
 * @returns {string} A random message from the chosen pool.
 */
const getRandomMessage = ( op, item, score ) => {
  const messageSets = messages[ op ];
  var setRandom,
      set,
      totalProbability = 0,
      chosenSet = null,
      format = '';

  switch ( op ) {
    case operation.MINUS:
    case operation.PLUS:
      format = '<message> *<item>* is now on <score> point<plural>.';
      break;

    case operation.SELF:
      format = '<item> <message>';
      break;

    default:
      throw 'Invalid operation: ' + op;
  }

  for ( set of messageSets ) {
    totalProbability += set.probability;
  }

  setRandom = Math.floor( Math.random() * totalProbability );

  for ( set of messageSets ) {
    setRandom -= set.probability;

    if ( 0 > setRandom ) {
      chosenSet = set.set;

      break;
    }
  }

  if ( null === chosenSet ) {
    throw 'Could not find set for ' + op + ' ran out of sets with ' + setRandom + ' remaining';
  }

  const plural = 1 === Math.abs( score ) ? '' : 's';
  const max = chosenSet.length - 1;
  const random = Math.floor( Math.random() * max );
  const message = chosenSet[ random ];

  const formattedMessage = format.replace( '<item>', item )
    .replace( '<score>', score )
    .replace( '<plural>', plural )
    .replace( '<message>', message );

  return formattedMessage;

};

module.exports = {
  getRandomMessage: getRandomMessage
};
