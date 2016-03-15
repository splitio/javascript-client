/**
Copyright 2016 Split Software

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
**/

import type {
  Thenable
} from '../types';

const segmentChangesService = require('@splitsoftware/splitio-services/lib/segmentChanges');
const segmentChangesRequest = require('@splitsoftware/splitio-services/lib/segmentChanges/get');

const segmentMutatorFactory = require('../mutators/segmentChanges');
const cache = new Map();

function cacheKeyGenerator(authorizationKey, segmentName) {
  return `${authorizationKey}/segmentChanges/${segmentName}`;
}

function segmentChangesDataSource({
  authorizationKey,
  segmentName
}) :Thenable {
  const cacheKey = cacheKeyGenerator(authorizationKey, segmentName);
  const since = cache.get(cacheKey) || -1;

  return segmentChangesService(segmentChangesRequest({
    since,
    segmentName
  }))
  .then(resp => resp.json())
  .then(json => {
    let {since, till, ...data} = json;

    cache.set(cacheKey, till);

    return segmentMutatorFactory( data );
  })
  .catch(() => { /* noop */ });
}

module.exports = segmentChangesDataSource;
