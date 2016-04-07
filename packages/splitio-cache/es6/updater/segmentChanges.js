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

const log = require('debug')('splitio-cache:updater');

const segmentChangesDataSource = require('../ds/segmentChanges');

const storage = require('../storage');
const splitsStorage = storage.splits;
const segmentsStorage = storage.segments;
const getSegment = segmentsStorage.get.bind(segmentsStorage);
const updateSegment = segmentsStorage.update.bind(segmentsStorage);

function segmentChangesUpdater() {
  log('Updating segmentChanges');

  let downloads = [...splitsStorage.getSegments()].map(segmentName => {
    return segmentChangesDataSource(segmentName).then(mutator => {
      log(`completed download of ${segmentName}`);

      if (typeof mutator === 'function') {
        mutator(getSegment, updateSegment);
      }

      log(`completed mutations for ${segmentName}`);
    });
  });

  return Promise.all(downloads).then(() => {
    return storage;
  });
}

module.exports = segmentChangesUpdater;
