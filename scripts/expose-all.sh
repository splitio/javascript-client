#!/usr/bin/env bash

# Expose all the modules inside NPM so we could link the development versions
# across different node versions.

cd packages/splitio-metrics
npm link
cd -

cd packages/splitio-engine
npm link
cd -

cd packages/splitio-cache
npm link
cd -

cd packages/splitio-engine
npm link
cd -

cd packages/splitio
npm link
cd -

cd packages/splitio-browser
npm link
cd -
