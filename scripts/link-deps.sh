#!/usr/bin/env bash

# `npm link` or `npm install` will install by default the dependencies, so if
# you want to develop something, we need to remove the installed folder, and
# link each dependencies with the globals once.

# @see `expose-all.sh` `install-all.sh`

cd packages/splitio-metrics
rm -rf node_modules/@splitsoftware
npm link @splitsoftware/splitio
cd -

cd packages/splitio-engine
rm -rf node_modules/@splitsoftware
npm link @splitsoftware/splitio-cache
cd -

cd packages/splitio-cache
rm -rf node_modules/@splitsoftware
npm link @splitsoftware/splitio-engine
cd -

cd packages/splitio
rm -rf node_modules/@splitsoftware
npm link @splitsoftware/splitio-metrics
npm link @splitsoftware/splitio-cache
cd -

cd packages/splitio-browser
rm -rf node_modules/@splitsoftware
npm link @splitsoftware/splitio
cd -
