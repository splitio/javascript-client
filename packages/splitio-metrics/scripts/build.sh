#!/usr/bin/env bash

# Copyright 2016 Split Software
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

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

# Regenerate test/lib directory
./node_modules/.bin/babel test/es6 --out-dir test/lib --source-maps
cd test/es6
find . -name *.json | xargs -J % gcp --parents % ../lib/
find . -name *.csv | xargs -J % gcp --parents % ../lib/
cd -
