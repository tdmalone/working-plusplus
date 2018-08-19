# Contributing to Working PlusPlus++

Contributions are welcome! [Create an issue](https://github.com/tdmalone/working-plusplus/issues/new) if there's something you'd like to see or [send a pull request](https://github.com/tdmalone/working-plusplus/compare) if you can implement it yourself.

## Installing Locally

To develop locally against a real, working instance, follow most of the *Installation* instructions in the [README](README.md), except **instead of step 5** (deploying to Heroku), clone this repo locally and then install dependencies:

    $ git clone https://github.com/tdmalone/working-plusplus
    $ cd working-plusplus
    $ yarn

You'll need [Node.js](https://nodejs.org/) already installed on your system. In addition, if you don't have [Yarn](https://yarnpkg.com/en/) and don't want it, you can use `npm install` instead of `yarn` above (but you might not get _exactly_ the same dependency versions).

You'll also need a local installation of PostgreSQL (or a server you can utilise) and a clean database you can use. [Here's an easy-to-use Postgres app for Macs](https://postgresapp.com/). Working PlusPlus++ requires at least PostgreSQL 9.5, but 10+ is recommended.

Make the following environment variables accessible to the app:

- **`SLACK_BOT_USER_OAUTH_ACCESS_TOKEN`**: from step 4 of the [installation instructions](README.md)
- **`SLACK_VERIFICATION_TOKEN`**: from step 4 of the [installation instructions](README.md)
- **`DATABASE_URL`**: in the format `postgres://user@localhost:5432/databasename`

Then, run the app:

    $ node index.js

Or if you have the [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) installed:

    $ heroku local

ℹ️ _For more help on using `heroku local`, see the [Heroku Local Dev Center article](https://devcenter.heroku.com/articles/heroku-local)._

If you make changes to the app, press Ctrl+C to exit, and then run it again.

Finally, you'll need to be able to have Slack contact your development instance directly. If you don't have the ability to forward a port through to your machine, I recommend [ngrok](https://ngrok.com/). Download and extract, then in the directory you've extracted it in run:

    ./ngrok http 80 # Or port 5000 if you're running with heroku local.

ngrok will provide you with the public URL your app is accessible on. This is the URL you'll then need to use in **step 6** of the [installation instructions](README.md).

Other than the modifications to steps 5 and 6, make sure you've followed all the rest of the installation instructions. You should then be set up and ready with a local development instance that you can interact with directly on Slack! If you run into any problems, feel free to [create an issue](https://github.com/tdmalone/working-plusplus/issues/new).

## Linting and Running Tests

This app has an extensive test suite, just because. Before submitting pull requests, please check that your changes pass linting and tests by running `yarn lint` and `yarn test`. These will also be run for you by Travis CI, but it's often quicker to debug and resolve the issues locally.

⚠️ _You will need access to a PostgreSQL server to run the integration and end-to-end tests. If you don't, just run the unit tests (see below) and let Travis CI run the full test suite for you._

ℹ️ _If you don't have Yarn, you can replace any mention of `yarn` in this section with `npm run`._

You can run just a subset of tests:
- Unit tests with `yarn unit-tests`
- Integration tests with `yarn integration-tests`
- End-to-end tests with `yarn e2e-tests`

You can modify the default testing behaviour by adjusting the relevant `scripts` in [`package.json`](package.json) or in some cases by passing additional [Jest configuration parameters](https://jestjs.io/docs/en/configuration.html) at the end of the test commands above.

If you come across annoying *stylistic* linting rules, feel free to [change them](https://eslint.org/docs/rules/) in [`.eslintrc.js`](.eslintrc.js) as part of your pull request, providing they don't cause an adverse effect on existing code.

Many linting issues can be automatically fixed by running `yarn fix`.
