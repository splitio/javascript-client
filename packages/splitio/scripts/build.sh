#!/usr/bin/env bash
##
# Bundle system for transpile everything from ES6 to ES5 and copying any json
# file used as package descriptor or mock.
##

# Cleanup the directories which will be regenerated.
rm -rf lib/
rm -rf test/lib/

# Regenerate lib directory
./node_modules/.bin/babel es6 --out-dir lib --source-maps
cd es6
find . -name *.json | xargs -J % gcp --parents % ../lib/
cd -
