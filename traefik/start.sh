#!/usr/bin/env bash

script_path=$(dirname $0)
cd ${script_path}

if [[ ! -e ./.certs ]]; then
  mkdir ./.certs
fi

sudo bash ./genlocalcrt.sh ./.certs

if [[ -z "$(docker network ls | fgrep -i proxy)" ]]; then
  docker network create proxy
fi

if [[ "$(uname -s)" == "Linux" ]]; then
  sudo ifconfig lo:0 10.254.254.254
elif [[ "$(uname -s)" == "Darwin" ]]; then
  sudo ifconfig lo0 alias 10.254.254.254
fi
