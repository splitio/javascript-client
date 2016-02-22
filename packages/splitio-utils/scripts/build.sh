#!/usr/bin/env bash
##
# Bundle system for transpile everything from ES6 to ES5 and copying any json
# file used as package descriptor or mock.
##

# Regenerate lib directory
./node_modules/.bin/babel es6 --out-dir lib --source-maps
cd es6
find . -name *.json | xargs -J % gcp --parents % ../lib/
cd -

# Regenerate test/lib directory
./node_modules/.bin/babel test/es6 --out-dir test/lib --source-maps
cd test/es6
find . -name *.json | xargs -J % gcp --parents % ../lib/
find . -name *.csv | xargs -J % gcp --parents % ../lib/
cd -
