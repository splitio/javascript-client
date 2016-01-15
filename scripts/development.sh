#!/usr/bin/env bash

npm link packages/split-engine
npm link packages/split-cache
npm link packages/split

cd packages/split-cache
rm -rf src/
npm install
npm run watch &
npm run watch-test &
cd -

cd packages/split-engine
rm -rf src/
npm install
npm run watch &
npm run watch-test &
cd -
