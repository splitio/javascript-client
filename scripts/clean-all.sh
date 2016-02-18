#!/usr/bin/env bash

cd packages/splitio-metrics
rm -rf lib/
rm -rf test/lib/
rm -rf node_modules/
cd - &> /dev/null

cd packages/splitio-engine
rm -rf lib/
rm -rf test/lib/
rm -rf node_modules/
cd - &> /dev/null

cd packages/splitio-cache
rm -rf lib/
rm -rf test/lib/
rm -rf node_modules/
cd - &> /dev/null

cd packages/splitio
rm -rf lib/
rm -rf test/lib/
rm -rf node_modules/
cd - &> /dev/null

cd packages/splitio-browser
rm -rf node_modules/
rm -rf bundle/*
touch bundle/production.js
touch bundle/development.js
cd - &> /dev/null
