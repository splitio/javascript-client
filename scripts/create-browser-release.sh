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

set -e

RELEASE_DIR=browser-release

if [ "$CI_BRANCH" == "dev" ]; then

  mkdir -p $RELEASE_DIR
  cd $RELEASE_DIR
  mkdir node_modules
  npm link @splitsoftware/splitio
  npm link @splitsoftware/splitio-browser
  node node_modules/.bin/splitio-bundler

fi
