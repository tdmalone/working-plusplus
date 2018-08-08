# Working PlusPlus++

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

   Scroll down and, under *Subscribe to Bot Events*, add the `message.channels` and `message.groups` events, then click *Save Changes*.

1. **Invite your new bot to any channel in your Slack team.**

1. **Think of someone who's been awesome lately and send `@Someone++`!**

## Detailed Instructions

Further instructions, such as hosting elsewhere, upgrading, etc. are coming soon.

## Contributing

Contributions are welcome! [Create an issue](https://github.com/tdmalone/working-plusplus/issues/new) if there's something you'd like to see or [send a pull request](https://github.com/tdmalone/working-plusplus/compare) if you can implement it yourself.

To develop locally, follow most of the *Installation* instructions above, except rather than deploying to Heroku, clone this repo locally and then install dependencies:

    $ git clone https://github.com/tdmalone/working-plusplus
    $ cd working-plusplus
    $ yarn

You'll need [Node.js](https://nodejs.org/) already installed on your system. In addition, if you don't have [Yarn](https://yarnpkg.com/en/) and don't want it, you can use `npm install` instead of `yarn` above (but you might not get _exactly_ the same dependency versions).

After installing, to run the app:

    $ node index.js

Or if you have the [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) installed:

    $ heroku local

_For more help on running `heroku local`, see the [Heroku Local Dev Center article](https://devcenter.heroku.com/articles/heroku-local)._

If you make changes to the app, press Ctrl+C to exit, and then run it again.

Finally, you'll need to be able to have Slack contact your development instance directly. If you don't have the ability to forward a port through to your machine, I recommend [ngrok](https://ngrok.com/). Download and extract, then in the directory you've extracted it in run:

    ./ngrok http 80 # Or port 5000 if you're running with heroku local.

ngrok will provide you with the public URL your app is accessible on; this is the URL you'll need to use in Step 6 of the installation instructions above.

## TODO

Although it works, it's very basic. Enhancements include:

* Improve tests for much better coverage
* A way to retrieve the current version/git hash from Slack, for sanity-checking of deployments
* Leaderboard functionality (either, or both, via a full leaderboard on the web - with some sort of token or oauth - and a shorter leaderboard via a command in Slack)
* The ability to customise the messages the bot sends back (eg. via environment variables)
* Move to the newer, more secure method of calculating signatures for incoming Slack hooks
* A way to look up someone's karma without necessarily `++`'ing or `--`'ing them (eg. `@username==`)
* Support for posting back messages within threads, rather than automatically jumping back out to the channel
* Support for detecting multiple actions within one message
* Natural language processing to figure out positive and negative sentiment automatically
* Option to deduct karma instead of adding karma when someone tries to give themselves karma
* Option to deduct karma automatically for swearing (with customisable word list?)
* Record and make accessible how many karma points someone has _given_

## License

[MIT](LICENSE).
