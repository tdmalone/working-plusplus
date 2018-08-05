# Working PlusPlus++

Like [plusplus.chat](https://plusplus.chat/), except this one actually works - because you can host it yourself! 😉

**UNDER CONSTRUCTION.** Despite the above display of confidence, this app will actually _not_ work yet, because it's still under construction. Come back soon, or check out the [`dev` branch](https://github.com/tdmalone/working-plusplus/tree/dev) if you're brave.

## Installation

1. **Deploy the app somewhere.**

   Heroku is recommended because it's simple and easy, and on most Slack teams this should not cost you a cent (assuming you haven't already exceeded your Heroku 1000-free-hours per month).

   [![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

    Find out more about Heroku [here](https://www.heroku.com/about) or [here](https://devcenter.heroku.com/), and Heroku Postgres [here](https://www.heroku.com/postgres) or [here](https://elements.heroku.com/addons/heroku-postgresql). To increase the free hours available to your account you may need to add a credit card. The hours used by the app will vary depending on the activity on your Slack account, but it won't cost you anything unless you upgrade your plan to support increased scale.

2. **Create a new app in your Slack team.**

   You can do this from the [Slack API Apps page](https://api.slack.com/apps). You'll need permission to add new apps, which depending on your team settings might require an admin to do it for you.

3. **From *Basic Information* in the app menu, switch on *Event Subscriptions* for your app.**

   Enter your app address - eg. `https://my-plusplus.herokuapp.com` - as the request URL.

   Scroll down and subscribe to the `message.channels` and `message.groups` permissions, then click *Save Changes*.

4. **From *Basic Information* in the app menu, add *Permissions* for your app.**

   Under *Scopes*, you'll need to select `chat:write:bot` and *Save Changes*.

5. **Add your OAuth Access Token to the Heroku app.**

   You'll find the token at the top of the *OAuth & Permissions* page. Copy it and stick it in your Heroku app under *Settings* -> *Reval Config Vars*.

6. **Write @someone++ on Slack!**

## Detailed Instructions

Coming soon!
