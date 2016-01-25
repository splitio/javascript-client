#!/usr/bin/env bash

cd packages/splitio-engine
rm -rf lib/
rm -rf node_modules/
npm update
npm prune
npm link
# npm run watch &
# npm run watch-test &
cd -

cd packages/splitio-cache
rm -rf lib/
rm -rf node_modules/
npm link @splitsoftware/splitio-engine
npm link
npm update
npm prune
# npm run watch &
# npm run watch-test &
cd -

cd packages/splitio-engine
npm link @splitsoftware/splitio-cache
cd -

cd packages/splitio
rm -rf lib/
rm -rf node_modules/
npm link @splitsoftware/splitio-cache
npm update
npm prune
npm link
# npm run watch &
# npm run watch-test &
cd -

cd packages/splitio-browser
rm -rf node_modules/
npm link @splitsoftware/splitio
npm update
npm prune
npm link
# npm run watch &
# npm run watch-test &
cd -
