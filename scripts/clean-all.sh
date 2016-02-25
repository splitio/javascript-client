#!/usr/bin/env bash

cd packages/splitio-utils
rm -rf lib/
rm -rf test/lib/
rm -rf node_modules/
cd - &> /dev/null

cd packages/splitio-services
rm -rf lib/
rm -rf test/lib/
rm -rf node_modules/
cd - &> /dev/null

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
