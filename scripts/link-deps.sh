#!/usr/bin/env bash

cd packages/splitio-metrics
rm -rf node_modules/@splitsoftware
npm link @splitsoftware/splitio
cd -

cd packages/splitio-engine
rm -rf node_modules/@splitsoftware
npm link @splitsoftware/splitio-cache
cd -

cd packages/splitio-cache
rm -rf node_modules/@splitsoftware
npm link @splitsoftware/splitio-engine
cd -

cd packages/splitio
rm -rf node_modules/@splitsoftware
npm link @splitsoftware/splitio-metrics
npm link @splitsoftware/splitio-cache
cd -

cd packages/splitio-browser
rm -rf node_modules/@splitsoftware
npm link @splitsoftware/splitio
cd -
