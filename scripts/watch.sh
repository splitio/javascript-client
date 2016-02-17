#!/usr/bin/env bash

cd packages/splitio-metrics
npm run watch &
npm run watch-test &
cd -

cd packages/splitio-engine
npm run watch &
npm run watch-test &
cd -

cd packages/splitio-cache
npm run watch &
npm run watch-test &
cd -

cd packages/splitio
npm run watch &
npm run watch-test &
cd -

cd packages/splitio-browser
npm run watch &
npm run watch-test &
cd -
