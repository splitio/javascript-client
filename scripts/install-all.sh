#!/usr/bin/env bash

cd packages/splitio-utils
npm install
npm prune
cd - &> /dev/null

cd packages/splitio-services
npm install
npm prune
cd - &> /dev/null

cd packages/splitio-metrics
npm install
npm prune
cd - &> /dev/null

cd packages/splitio-engine
npm install
npm prune
cd - &> /dev/null

cd packages/splitio-cache
npm install
npm prune
cd - &> /dev/null

cd packages/splitio
npm install
npm prune
cd - &> /dev/null

cd packages/splitio-browser
npm install
npm prune
cd - &> /dev/null
