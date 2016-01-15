#!/usr/bin/env bash

npm link packages/splitio-engine
npm link packages/splitio-cache
npm link packages/splitio

cd packages/splitio-cache
rm -rf src/
rm -rf node_modules/
npm install
npm run watch &
npm run watch-test &
cd -

cd packages/splitio-engine
rm -rf src/
rm -rf node_modules/
npm install
npm run watch &
npm run watch-test &
cd -

cd packages/splitio
rm -rf src/
rm -rf node_modules/
npm install
npm run watch &
npm run watch-test &
cd -
