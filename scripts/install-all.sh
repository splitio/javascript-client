#!/usr/bin/env bash

cd packages/splitio-utils
npm install
cd - &> /dev/null

cd packages/splitio-services
npm install
cd - &> /dev/null

cd packages/splitio-metrics
npm install
cd - &> /dev/null

cd packages/splitio-engine
npm install
cd - &> /dev/null

cd packages/splitio-cache
npm install
cd - &> /dev/null

cd packages/splitio
npm install
cd - &> /dev/null

cd packages/splitio-browser
npm install
cd - &> /dev/null
