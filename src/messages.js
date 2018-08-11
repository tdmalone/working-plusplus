/**
 * Provides messages for random selection.
 *
 * TODO: Add the ability to customise these messages - probably via JSON objects in environment
 *       variables.
 *
 * @author Julian Calaby <julian.calaby@gmail.com>
 */

'use strict';

const operations = require( './operations' );
const messages = {};

messages[ operations.PLUS ] = [
  {
    probability: 100,
    set: [
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
  },
  {
    probability: 1,
    set: [ ':shifty:' ]
  }
];

messages[ operations.MINUS ] = [
  {
    probability: 100,
    set: [
      'Oh RLY?',
      'Oh, really?',
      'Oh :slightly_frowning_face:.',
      'I see.',
      'Ouch.',
      'Oh là là.',
      'Oh.',
      'Condolences.'
    ]
  },
  {
    probability: 1,
    set: [ ':shifty:' ]
  }
];

messages[ operations.SELF ] = [
  {
    probability: 100,
    set: [
      'Hahahahahahaha no.',
      'Nope.',
      'No. Just no.',
      'Not cool!'
    ]
  },
  {
    probability: 1,
    set: [ ':shifty:' ]
  }
];

/**
 * Retrieves a random message from the given pool of messages.
 *
 * @param {string}  operation The name of the operation to retrieve potential messages for.
 *                            See operations.js.
 * @param {string}  item      The subject of the message, either "<@user>" or "object".
 * @param {integer} score     The item's current score.
 *
 * @returns {string} A random message from the chosen pool.
 */
const getRandomMessage = ( operation, item, score ) => {

  const messageSets = messages[ operation ];

  let setRandom,
      set,
      totalProbability = 0,
      chosenSet = null,
      format = '';

  switch ( operation ) {
    case operations.MINUS:
    case operations.PLUS:
      format = '<message> *<item>* is now on <score> point<plural>.';
      break;

    case operations.SELF:
      format = '<item> <message>';
      break;

    default:
      throw 'Invalid operation: ' + operation;
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
    throw (
      'Could not find set for ' + operation + ' ran out of sets with ' + setRandom + ' remaining'
    );
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

}; // GetRandomMessage.

module.exports = {
  getRandomMessage: getRandomMessage,
  messages: messages
};
