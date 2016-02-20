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
rm -rf lib/*
touch lib/production.js
touch lib/development.js
touch lib/localhost.js
cd - &> /dev/null
