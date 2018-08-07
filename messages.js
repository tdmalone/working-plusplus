/**
 * Provides messages for random selection.
 *
 * TODO: Add the ability to customise these messages - probably via JSON objects in environment
 *       variables.
 */

'use strict';

const messages = {

  plus: [
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
  ],

  minus: [
    'Oh RLY?',
    'Oh, really?',
    'Oh :slightly_frowning_face:.',
    'I see.',
    'Ouch.',
    'Oh là là.',
    'Oh.',
    'Condolences.'
  ],

  selfPlus: [
    'Hahahahahahaha no.',
    'Nope.',
    'No. Just no.',
    'Not cool!'
  ]

};

/**
 * Retrieves a random message from the given pool of messages.
 *
 * @param {string} operation The name of the operation to retrieve potential messages for. Accepts
 *                           'plus', 'minus', and 'selfPlus', as well as the shorthand '+' and '-'.
 * @returns {string} A random message from the chosen pool.
 */
const getRandomMessage = ( operation ) => {
  const filteredOperation = operation.replace( '+', 'plus' ).replace( '-', 'minus' ),
        max = messages[ filteredOperation ].length - 1,
        random = Math.floor( Math.random() * max );

  return messages[ filteredOperation ][ random ];
};

module.exports = {
  getRandomMessage: getRandomMessage
};
