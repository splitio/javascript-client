#!/usr/bin/env bash

npm link packages/split-parser
npm link packages/split-engine

cd packages/split-parser
npm run watch &
npm run watch-test &
cd -

cd packages/split-engine
npm run watch &
npm run watch-test &
cd -
