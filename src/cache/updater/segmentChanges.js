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
'use strict';

const log = require('debug')('splitio-cache:updater');
const segmentChangesDataSource = require('../ds/segmentChanges');

module.exports = function SegmentChangesUpdater(settings, hub, storage) {
  const sinceValuesCache = new Map();
  let segmentsAreReady = new Map();
  let startingUp = true;

  return function updateSegments() {
    log('Updating segmentChanges');

    const downloads = [...storage.splits.getSegments()].map(segmentName => {
      // register segments for future check if they are ready or not
      if (startingUp) {
        if (segmentsAreReady.get(segmentName) === undefined) {
          segmentsAreReady.set(segmentName, false);
        }
      }

      return segmentChangesDataSource(settings, segmentName, sinceValuesCache).then(({
        shouldUpdate, isFullUpdate, mutator
      }) => {
        log(`completed download of ${segmentName}`);

        // apply mutations
        mutator(storage);

        // register segment data as ready if required
        if (startingUp && segmentsAreReady.get(segmentName) === false && isFullUpdate) {
          segmentsAreReady.set(segmentName, true);
        }

        // did we apply an update?
        return shouldUpdate;
      });
    });

    return Promise.all(downloads).then(shouldUpdates => {
      // if at least one segment was updated
      const shouldUpdate = shouldUpdates.indexOf(true) !== -1;

      // check if everything was correctly downloaded only required on start up
      if (startingUp) {
        let ready = true;

        for (const v of segmentsAreReady.values()) {
          ready = ready && v;
        }

        if (ready) {
          startingUp = false;
          segmentsAreReady = null;
          hub.emit(hub.Event.SDK_SEGMENTS_ARRIVED);
        }
      }
      // should we notificate an update?
      else {
        shouldUpdate && hub.emit(hub.Event.SDK_SEGMENTS_ARRIVED);
      }

      return shouldUpdate;
    });
  };
};
