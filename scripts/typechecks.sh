#!/usr/bin/env bash

cd ..
$(./node_modules/.bin/flow check)
cd -
