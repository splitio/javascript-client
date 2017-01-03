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
// @flow

'use strict';

const log = require('debug')('splitio-producer:my-segments');
const mySegmentsFetcher = require('../fetcher/MySegments');

function MySegmentsUpdater(settings: Object, hub: EventEmitter, storage: SplitStorage) {
  let readyOnAlreadyExistentState = true;
  let startingUp = true;

  return function updateMySegments(retry: number = 0) {
    return mySegmentsFetcher(settings, startingUp).then(segments => {
      let shouldNotifyUpdate = false;

      // Only we download segments completely, we should not keep retrying anymore
      startingUp = false;

      for (let s of segments) {
        if (!storage.segments.isInSegment(s)) {
          shouldNotifyUpdate = true;
          storage.segments.addToSegment(s);
        }
      }

      if (shouldNotifyUpdate || readyOnAlreadyExistentState) {
        readyOnAlreadyExistentState = false;
        hub.emit(hub.SDK_SEGMENTS_ARRIVED);
      }
    })
    .catch(error => {
      if (startingUp && settings.startup.retriesOnFailureBeforeReady > retry) {
        retry += 1;
        log('Retrying download of segments #%s reason %s', retry, error);
        return updateMySegments(retry);
      } else {
        startingUp = false;
      }

      return false; // shouldUpdate = false
    });
  };

}

module.exports = MySegmentsUpdater;
