#!/usr/bin/env bash
#
# Installs PostgreSQL 10 on Travis CI, as the default build images don't support it yet.
#
# @see https://github.com/travis-ci/travis-ci/issues/8537#issuecomment-354020356

set -euxo pipefail

echo "Installing Postgres 10..."
sudo service postgresql stop
sudo apt-get remove --quiet 'postgresql-*'
sudo apt-get update --quiet
sudo apt-get install --quiet postgresql-10 postgresql-client-10
sudo cp /etc/postgresql/{9.6,10}/main/pg_hba.conf

echo "Restarting Postgres 10..."
sudo service postgresql restart
