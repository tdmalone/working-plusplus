/**
 * Unit tests on the event handlers in events.js.
 *
 * @see https://jestjs.io/docs/en/expect
 * @see https://github.com/jest-community/jest-extended#api
 * @author Tim Malone <tdmalone@gmail.com>
 */

/* global jest */

'use strict';

const events = require( '../src/events' );
const handlers = events.handlers;

const slack = require( '../src/slack' ),
      points = require( '../src/points' ),
      messages = require( '../src/messages' );

const slackClientMock = require( './mocks/slack' );
slack.setSlackClient( slackClientMock );

slack.sendMessage = jest.fn();
points.updateScore = jest.fn();
messages.getRandomMessage = jest.fn();

// Catch all console output during tests.
console.error = jest.fn();
console.info = jest.fn();
console.log = jest.fn();
console.warn = jest.fn();

// Clear module cache + mock counts due to us sometimes messing with mocks.
beforeEach( () => {
  jest.resetModules();
  messages.getRandomMessage.mockClear();
  slack.sendMessage.mockClear();
});

describe( 'handleSelfPlus', () => {

  const user = 'U12345678',
        channel = 'C12345678';

  it( 'logs an attempt by a user to increment their own score', () => {
    events.handleSelfPlus( user, channel );
    expect( console.log ).toHaveBeenCalledTimes( 1 );
  });

  it( 'gets a message from the \'self plus\' collection', () => {
    events.handleSelfPlus( user, channel );

    expect( messages.getRandomMessage )
      .toHaveBeenCalledTimes( 1 )
      .toHaveBeenCalledWith( 'selfPlus', user );
  });

  it( 'sends a message back to the user and channel that called it', () => {
    const slack = require( '../src/slack' ),
          events = require( '../src/events' );

    slack.sendMessage = jest.fn();
    slack.setSlackClient( slackClientMock );

    events.handleSelfPlus( user, channel );

    expect( slack.sendMessage )
      .toHaveBeenCalledTimes( 1 )
      .toHaveBeenCalledWith( expect.stringContaining( user ), channel );
  });

});

describe( 'handlePlusMinus', () => {

  const item = 'SomeRandomThing',
        channel = 'C12345678',
        score = 5;

  /** @returns {integer} Returns a fake score. */
  const updateScoreMock = () => {
    return score;
  };

  it( 'calls the score updater to update an item\'s score', () => {
    const slack = require( '../src/slack' ),
          points = require( '../src/points' ),
          events = require( '../src/events' );

    slack.setSlackClient( slackClientMock );
    points.updateScore = jest.fn();

    events.handlePlusMinus( item, '+', channel );

    expect( points.updateScore )
      .toHaveBeenCalledTimes( 1 )
      .toHaveBeenCalledWith( item, '+' );
  });

  it.each([ [ 'plus', '+' ], [ 'minus', '-' ] ])(
    'gets a message from the \'%s\' collection',
    ( operationName, operation ) => {
      expect.hasAssertions();

      const slack = require( '../src/slack' ),
            points = require( '../src/points' ),
            events = require( '../src/events' ),
            messages = require( '../src/messages' );

      slack.setSlackClient( slackClientMock );
      points.updateScore = jest.fn( updateScoreMock );
      messages.getRandomMessage = jest.fn();

      return events.handlePlusMinus( item, operation, channel ).then( () => {
        expect( messages.getRandomMessage )
          .toHaveBeenCalledTimes( 1 )
          .toHaveBeenCalledWith( operationName, item, score );
      });
    }
  );

  it( 'sends a message back to the channel that called it', () => {
    expect.hasAssertions();

    const slack = require( '../src/slack' ),
          points = require( '../src/points' ),
          events = require( '../src/events' );

    slack.setSlackClient( slackClientMock );
    points.updateScore = jest.fn();
    slack.sendMessage = jest.fn();

    return events.handlePlusMinus( item, '+', channel ).then( () => {
      expect( slack.sendMessage )
        .toHaveBeenCalledTimes( 1 )
        .toHaveBeenCalledWith( expect.stringContaining( item ), channel );
    });
  });

}); // HandlePlusMinus.

describe( 'sayThankyou', () => {

  it( 'returns a Promise to send a Slack message', () => {

  });

  it( 'sends a Slack message back to the user & channel who wrote to it', () => {

  });

}); // SayThankyou.

describe( 'sendHelp', () => {

  it( 'returns a Promise to send a Slack message', () => {

  });

  it( 'sends a Slack message back to the channel that wrote to it', () => {

  });

}); // SendHelp.

describe( 'getVersion', () => {

  it( 'returns a Promise to send a Slack message', () => {

  });

  it( 'sends a Slack message back to the channel that wrote to it', () => {

  });

  it( 'includes the current version of the app in the message', () => {

  });

  it( 'includes the current version of Node.js in the message', () => {

  });

  it( 'includes the current commit of the app, when git is available', () => {

  });

  it( 'includes the current commit of the app, when Heroku env vars are available', () => {

  });

  it( 'doesn\'t crash if both git and Heroku env vars are not available', () => {

  });

}); // GetVersion.

describe( 'handlers.message', () => {

  const eventType = 'message';

  it( 'returns false if a valid item cannot be extracted', () => {
    const event = {
      type: eventType,
      text: '@Invalid#Item++'
    };

    expect( handlers.message( event ) ).toBeFalse();
  });

  it( 'returns false if a valid operation cannot be extracted', () => {
    const event = {
      type: eventType,
      text: '<@U12345678>+-+' // Invalid operation.
    };

    expect( handlers.message( event ) ).toBeFalse();
  });

  it( 'returns false if a user trying to ++ themselves', () => {
    const event = {
      type: eventType,
      text: '<@U12345678>++',
      user: 'U12345678'
    };

    expect( handlers.message( event ) ).toBeFalse();
  });

}); // HandleMessageEvent.

describe( 'handlers.appMention', () => {

  const eventType = 'app_mention';

  const appCommandTable = [
    [ 'leaderboard', 'leaderboard.js' ]
  ];

  it.each( appCommandTable )( 'calls the app command handler for %s', ( command, handlerFile ) => {

    const event = {
      type: eventType,
      text: '<@U00000000> ' + command
    };

    const events = require( '../src/events' ),
          commandHandler = require( '../src/' + handlerFile );

    commandHandler.handler = jest.fn();
    events.handlers.appMention( event );
    expect( commandHandler.handler ).toHaveBeenCalledTimes( 1 );

  });

}); // Handlers.appMention.

describe( 'handleEvent', () => {

  const validEvents = [
    [ 'message', '@Hello++' ],
    [ 'app_mention', '<@U12345678> can haz leaderboard' ]
  ];

  const request = {
    headers: { host: 'test.local' }
  };

  it.each( validEvents )( 'returns a Promise for a \'%s\' event with text', ( type, text ) => {
    const event = {
      type,
      text
    };

    expect( events.handleEvent( event, request ) instanceof Promise ).toBeTrue();
  });

  it.each( validEvents )( 'reports a \'%s\' event without text as invalid', ( type ) => {
    const event = { type };
    expect( events.handleEvent( event ) ).toBeFalse();
  });

  it.each( validEvents )( 'reports a \'%s\' event with a space for text as invalid', ( type ) => {
    const event = {
      type,
      text: ' '
    };

    expect( events.handleEvent( event ) ).toBeFalse();
  });

  it( 'reports an event with missing type as invalid', () => {
    const event = { text: 'Hello' };
    expect( events.handleEvent( event ) ).toBeFalse();
  });

  it( 'reports an event with some random type as invalid', () => {
    const event = {
      type: 'random',
      text: 'Hello'
    };

    expect( events.handleEvent( event ) ).toBeFalse();
  });

  it( 'reports an event with a subtype as invalid', () => {
    const event = {
      type: 'message',
      subtype: 'random',
      text: 'Hello'
    };

    expect( events.handleEvent( event ) ).toBeFalse();
  });

}); // HandleEvent.
