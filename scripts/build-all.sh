#!/usr/bin/env bash

cd packages/splitio-utils
npm run build
cd - &> /dev/null

cd packages/splitio-services
npm run build
cd - &> /dev/null

cd packages/splitio-metrics
npm run build
cd - &> /dev/null

cd packages/splitio-cache
npm run build
cd - &> /dev/null

cd packages/splitio-engine
npm run build
cd - &> /dev/null

cd packages/splitio
npm run build
cd - &> /dev/null
