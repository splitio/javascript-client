#!/usr/bin/env bash

cd packages/splitio-utils
npm publish --tag canary
cd - &> /dev/null

cd packages/splitio-services
npm publish --tag canary
cd - &> /dev/null

cd packages/splitio-metrics
npm publish --tag canary
cd - &> /dev/null

cd packages/splitio-cache
npm publish --tag canary
cd - &> /dev/null

cd packages/splitio-engine
npm publish --tag canary
cd - &> /dev/null

cd packages/splitio
npm publish --tag canary
cd - &> /dev/null

cd packages/splitio-browser
npm publish --tag canary
cd - &> /dev/null
