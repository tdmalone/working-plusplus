# Working PlusPlus++

Like [plusplus.chat](https://plusplus.chat/), except this one actually works - because you can host it yourself! 😉

## Installation

1. **Deploy the app somewhere.**

   Heroku is recommended because it's simple and easy, and on most Slack teams this should not cost you a cent (assuming you haven't already exceeded your Heroku 1000-free-hours per month).

   [![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

    Find out more about Heroku [here](https://www.heroku.com/about) or [here](https://devcenter.heroku.com/), and Heroku Postgres [here](https://www.heroku.com/postgres) or [here](https://elements.heroku.com/addons/heroku-postgresql). To increase the free hours available to your account you may need to add a credit card. The hours used by the app will vary depending on the activity on your Slack account, but it won't cost you anything unless you upgrade your plan to support increased scale. The Postgres addon is also free, for up to 10,000 rows (that's 10,000 unique users or things that your team can ++ or --).

2. **Create a new app in your Slack team.**

   You can do this from the [Slack API Apps page](https://api.slack.com/apps). You'll need permission to add new apps, which depending on your team settings might require an admin to do it for you.

3. **From *Basic Information* in the app menu, add a bot user for your app.**

    TODO: Add more details here.

4. **From *Basic Information* in the app menu, switch on *Event Subscriptions* for your app.**

   Enter your app address - eg. `https://my-plusplus.herokuapp.com` - as the request URL.

   Scroll down and, under *Bot Events*, subscribe to the `message.channels` and `message.groups` permissions, then click *Save Changes*.

5. **From *Basic Information* in the app menu, add *Permissions* for your app.**

   Under *Scopes*, you'll need to select `chat:write:bot` and *Save Changes*.
   
   Then, follow the prompts to install the app to your workspace.

6. **Add your *Bot User OAuth Access Token* & *Verification Token* to the Heroku app.**

   You'll find the *Bot User OAuth Access Token* at the top of the *OAuth & Permissions* page (make sure you grab the **bot** one), and the *Verification Token* under *App Credentials* on the *Basic Information* page.
   
   Copy both of these and stick them in your Heroku app under *Settings* -> *Reval Config Vars*.

7. **Invite @WorkingPlusPlus to any channel in your Slack team.**

8. **Write @someone++ on Slack!**

## Detailed Instructions

Coming soon!
