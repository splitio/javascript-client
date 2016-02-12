#!/usr/bin/env bash

cd packages/splitio-cache
npm test
cd -

cd packages/splitio-engine
npm test
cd -

cd packages/splitio
npm test
cd -

# cd packages/splitio-browser
# npm test
# cd -
