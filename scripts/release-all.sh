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

#
# NOTE: npm publish sets tag 'latest' if no --tag specified
#

cd packages/splitio-utils
npm publish
cd - &> /dev/null

cd packages/splitio-services
npm publish
cd - &> /dev/null

cd packages/splitio-metrics
npm publish
cd - &> /dev/null

cd packages/splitio-cache
npm publish
cd - &> /dev/null

cd packages/splitio-engine
npm publish
cd - &> /dev/null

cd packages/splitio
npm publish
cd - &> /dev/null

cd packages/splitio-browser
npm publish
cd - &> /dev/null
