#!/usr/bin/env bash

# Verify our code is good enough for machines at least.

eslint packages/*/es6/**/*.js \
       packages/*/test/es6/**/*.js \
       packages/splitio-browser/lib/*.js
