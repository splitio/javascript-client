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

const log = require('debug')('splitio-cache:updater');

const segmentChangesDataSource = require('../ds/segmentChanges');

const storage = require('../storage');
const segmentsStorage = storage.segments;
const get = segmentsStorage.get.bind(segmentsStorage);
const update = segmentsStorage.update.bind(segmentsStorage);

function segmentChangesUpdater({authorizationKey}) :Thenable {
  log(`[${authorizationKey}] Updating segmentChanges`);

  // Read the list of segments available.
  const segments = storage.splits.getSegments();

  // Per each segment, request the changes and mutate the storage accordingly.
  return Promise.all(
    [...segments].map(segmentName => segmentChangesDataSource({authorizationKey, segmentName}))
  ).then(segmentsMutators => {
    segmentsMutators.forEach(mutator => mutator(get, update));
  }).then(() => storage);
}

module.exports = segmentChangesUpdater;
