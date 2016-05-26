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

# `npm link` or `npm install` will install by default the dependencies, so if
# you want to develop something, we need to remove the installed folder, and
# link each dependencies with the globals once.

# @see `expose-all.sh` `install-all.sh`

cd packages/splitio-services
rm -rf node_modules/@splitsoftware
npm link @splitsoftware/splitio-utils
cd -

cd packages/splitio-metrics
rm -rf node_modules/@splitsoftware
npm link @splitsoftware/splitio-utils
npm link @splitsoftware/splitio-services
cd -

cd packages/splitio-cache
rm -rf node_modules/@splitsoftware
npm link @splitsoftware/splitio-engine
npm link @splitsoftware/splitio-services
npm link @splitsoftware/splitio-utils
cd -

cd packages/splitio
rm -rf node_modules/@splitsoftware
npm link @splitsoftware/splitio-metrics
npm link @splitsoftware/splitio-cache
npm link @splitsoftware/splitio-utils
cd -

cd packages/splitio-browser
rm -rf node_modules/@splitsoftware
npm link @splitsoftware/splitio
cd -
