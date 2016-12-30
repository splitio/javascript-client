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

const log = require('debug')('splitio-producer:segment-changes');
const segmentChangesFetcher = require('../fetcher/SegmentChanges');

const SegmentChangesUpdater = (settings : Object, segmentCache : SegmentCache) => {

  return async function updater() {
    log('Started segments update');

    // Async fetchers are collected here.
    const updaters = [];

    // Read list of available segments names to be updated.
    const segments = await segmentCache.getRegisteredSegments();

    for (let segmentName of segments) {
      const since: number = await segmentCache.getChangeNumber(segmentName);

      log('Processing segment %s', segmentName);

      updaters.push(
        segmentChangesFetcher(settings, segmentName, since).then(async function (changes: SegmentChanges) {
          // Apply all the collected mutations at once
          for (let x of changes) {
            if (x.added.length > 0)
              await segmentCache.addToSegment(segmentName, x.added);

            if (x.removed.length > 0)
              await segmentCache.removeFromSegment(segmentName, x.removed);

            if (x.added.length > 0 || x.removed.length > 0)
              await segmentCache.setChangeNumber(segmentName, x.till);

            log('Processed %s with till = %s added %s removed %s', segmentName, x.till, x.added.length, x.removed.length);
          }
        })
      );
    }

    return Promise.all(updaters);
  };

};

module.exports = SegmentChangesUpdater;
