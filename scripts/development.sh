#!/usr/bin/env bash

npm link packages/split
npm link packages/split-cache
npm link packages/split-parser

cd packages/split-cache
rm -rf src/
npm run watch &
npm run watch-test &
cd -

cd packages/split-parser
rm -rf src/
npm run watch &
npm run watch-test &
cd -
