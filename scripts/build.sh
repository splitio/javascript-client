#!/usr/bin/env bash

cd packages/splitio-cache
rm -rf lib/
npm run build
cp es6/storage/segments/package.json lib/storage/segments/package.json
cd -

cd packages/splitio-engine
rm -rf lib/
npm run build
cp es6/matchers/segment/package.json lib/matchers/segment/package.json
cd -

cd packages/splitio
rm -rf lib/
npm run build
cp es6/core/package.json lib/core/package.json
cd -
