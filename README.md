# Working PlusPlus++

[![Build Status](https://travis-ci.com/tdmalone/working-plusplus.svg?branch=master)](https://travis-ci.com/tdmalone/working-plusplus)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/d0d9b6c1d1c4430e9fad61bb60b5dc4e)](https://www.codacy.com/project/tdmalone/working-plusplus/dashboard)
[![Codacy Badge](https://api.codacy.com/project/badge/Coverage/d0d9b6c1d1c4430e9fad61bb60b5dc4e)](https://www.codacy.com/app/tdmalone/working-plusplus/files)

Like [plusplus.chat](https://plusplus.chat/), except this one actually works - because you can host it yourself! 😉

As PlusPlus++ says:

> Plus, minus, and keep score of all the good and not so good things your friends say and do on Slack.

It's as simple as writing in Slack:

```@Tim++ for being awesome!```

Or:

```@Cheeseburgers++```

Or:

```@CoffeeShop-- for forgetting my order ;(```

**Working PlusPlus++** will keep track of the score everyone (and everything) is sitting on.

Completely open source, so do with it what you like. Or if you don't want to make your own tweaks, deploy it as-is right now with the instructions below. You need somewhere to host it: [Heroku](https://heroku.com) is highly recommended because it's free in most cases, and performs super well.

## Installation

1. **Create a new app in your Slack team.**

   You can do this from the [Slack API Apps page](https://api.slack.com/apps). You'll need permission to add new apps, which depending on your team settings might require an admin to do it for you.

1. **Add a bot user for your app.**

    This can be done under *Bot Users* in the menu on the left. You can name it whatever you like, and for best results, select it to always show as online.

    This allows the app to speak back to your team when they ++ and -- things.

1. **Add chat permissions, and install the app.**

   Under *OAuth & Permissions*, scroll down to *Scopes* and add the `chat:write:bot` permission. Click *Save Changes*.

   You can now install the app. Scroll back up, click *Install App to Workspace*, and follow the prompts.

1. **Copy your tokens.**

   From the same *OAuth & Permissions* page, copy the ***Bot** User OAuth Access Token* (_not_ the non-bot token!) and store it somewhere.

   Go back to the *Basic Information* page, scroll down, and copy the *Verification Token* too.

1. **Deploy the app somewhere.**

   Heroku is recommended because it's simple and easy, and on most Slack teams this should not cost you a cent.

   [![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

    If you need to sign up first, do so, then come back here and click the Deploy button again.

    Find out more about Heroku [here](https://www.heroku.com/about) or [here](https://devcenter.heroku.com/), and Heroku Postgres [here](https://www.heroku.com/postgres) or [here](https://elements.heroku.com/addons/heroku-postgresql).

    To increase the free hours available to your account you may need to add a credit card. The hours used by the app will vary depending on the activity on your Slack account, but it won't cost you anything unless you upgrade your plan to support increased scale (or unless you have other Heroku apps using your hours!). The Postgres addon (for storing the scores) is also free for up to 10,000 rows (that's 10,000 unique users or things that your team can ++ or --).

    Hosting somewhere other than Heroku is fine too. See *Detailed Instructions* below.

1. **Back at Slack apps, switch on *Event Subscriptions* for your app.**

   Via *Event Subscriptions* in the left menu. After switching on, enter your new Heroku app address - eg. `https://my-plusplus.herokuapp.com` - as the request URL.

   Scroll down and, under *Subscribe to Bot Events*, select the relevant events for the features you want the app to support:

   * Select `message.channels` to support all general features in _public_ channels it is invited to
   * Select `message.groups` to support all general features in _private_ channels it is invited to
   * Select `app_mention` to support extended features such as leaderboards

   Finally, click *Save Changes*. If you wish, you can come back to this screen later and add or change the events the app handles.

1. **Invite your new bot to any channel in your Slack team.**

1. **Think of someone who's been awesome lately and send `@Someone++`!**

### More Information

Further instructions, such as hosting elsewhere, upgrading, etc. are coming soon.

## Usage

**Working PlusPlus++** will listen out for messages, in channels it has been invited to, for valid commands. Commands are accepted anywhere in a message - at the beginning, middle, or end - and are currently limited to one command per message (if multiple commands are sent, only the first one found will be handled).

Currently supported general commands are:

* `@Someone++`: Adds points to a user or a thing
* `@Someone--`: Subtracts points from a user or a thing

Currently supported extended commands are:

* `@WorkingPlusPlus leaderboard`: Displays the leaderboard for your Slack workspace
* `@WorkingPlusPlus help`: Displays a help message showing these commands
* `@WorkingPlusPlus version`: Returns version and environment information

If you set a different name for your bot when adding the app to your Slack workspace, use that name instead.

ℹ️ _Extended commands are supported if you've subscribed to the `app_mentions` event in your Slack app settings. See **Step 6** in the installation instructions above for further details._

## Contributing

Your contributions are welcome! [Create an issue](https://github.com/tdmalone/working-plusplus/issues/new) if there's something you'd like to see or [send a pull request](https://github.com/tdmalone/working-plusplus/compare) if you can implement it yourself.

For full details on contributing, including getting a local environment set up, see [CONTRIBUTING.md](CONTRIBUTING.md).

## TODO

Although it works, it's very basic. Potential enhancements include:

* The ability to customise the messages the bot sends back at runtime (eg. via environment variables)
* Move to the newer, more secure method of calculating signatures for incoming Slack hooks
* A way to look up someone's karma without necessarily `++`'ing or `--`'ing them (eg. `@username==`)
* Support for posting back messages within threads, rather than automatically jumping back out to the channel
* Support for detecting multiple commands within one message
* Natural language processing to figure out positive and negative sentiment automatically
* Option to deduct karma instead of adding karma when someone tries to give themselves karma
* Option to deduct karma automatically for swearing (with customisable word list?)
* Record and make accessible how many karma points someone has _given_
* Set up a Dockerfile to make local development easier (i.e. to not require Node, Yarn or Postgres)
* Improve error handling
* The ability to customise some of the leaderboard web functionality, such as colours and perhaps imagery as well
* Additional linting tools for CSS and HTML

## License

[MIT](LICENSE).
