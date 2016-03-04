#!/usr/bin/env bash

#
# NOTE: npm publish sets tag 'latest' if no --tag specified
#

cd packages/splitio-utils
npm publish
cd - &> /dev/null

cd packages/splitio-services
npm publish
cd - &> /dev/null

cd packages/splitio-metrics
npm publish
cd - &> /dev/null

cd packages/splitio-cache
npm publish
cd - &> /dev/null

cd packages/splitio-engine
npm publish
cd - &> /dev/null

cd packages/splitio
npm publish
cd - &> /dev/null

cd packages/splitio-browser
npm publish
cd - &> /dev/null
