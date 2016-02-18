#!/usr/bin/env bash

cd packages/splitio-metrics
npm test
cd - &> /dev/null

cd packages/splitio-cache
npm test
cd - &> /dev/null

cd packages/splitio-engine
npm test
cd - &> /dev/null

cd packages/splitio
npm test
cd - &> /dev/null
