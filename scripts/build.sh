#!/usr/bin/env bash

cd packages/splitio-metrics
npm run build
cd -

cd packages/splitio-cache
npm run build
cd -

cd packages/splitio-engine
npm run build
cd -

cd packages/splitio
npm run build
cd -

cd packages/splitio-browser
npm run build
cd -
