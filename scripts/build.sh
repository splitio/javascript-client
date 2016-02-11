#!/usr/bin/env bash

cd packages/splitio-cache
npm update
npm prune
npm run build
cd -

cd packages/splitio-engine
npm update
npm prune
npm run build
cd -

cd packages/splitio
npm update
npm prune
npm run build
cd -

cd packages/splitio-browser
npm update
npm prune
npm run build
cd -
