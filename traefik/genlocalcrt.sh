#!/usr/bin/env bash

dir=${1-.}
openssl=`which openssl`
openssldir=`${openssl} version -a | grep OPENSSLDIR |  awk '{gsub(/"/, "",  $2); print $2}'`
opensslconf="${openssldir:-/System/Library/OpenSSL}/openssl.cnf"

if [ -f ${dir}/local.key ] && [ -f ${dir}/local.crt ] ; then
  echo 'Certificate exists'
  exit
fi

$openssl req -new \
  -x509 \
  -nodes \
  -sha1 \
  -days 3650 \
  -newkey rsa:2048 \
  -keyout ${dir}/local.key \
  -out ${dir}/local.crt \
  -subj "/C=GB/ST=Local/L=Local/O=Local/CN=localhost" \
  -reqexts SAN \
  -extensions SAN \
  -config <(cat ${opensslconf} \
    <(printf '[SAN]\nsubjectAltName=DNS:localhost,DNS:*.localhost,DNS:docker.local'))
