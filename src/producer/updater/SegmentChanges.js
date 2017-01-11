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

const SegmentChangesUpdaterFactory = (settings: Object, readiness: ReadinessGate, storage: SplitStorage) => {
  let readyOnAlreadyExistentState = true;

  return async function SegmentChangesUpdater() {
    log('Started segments update');

    // Async fetchers are collected here.
    const updaters = [];

    // Read list of available segments names to be updated.
    const segments = await storage.segments.getRegisteredSegments();

    for (let segmentName of segments) {
      const since: number = await storage.segments.getChangeNumber(segmentName);

      log('Processing segment %s', segmentName);

      updaters.push(segmentChangesFetcher(settings, segmentName, since).then(async function (changes: SegmentChanges) {
        let changeNumber = -1;

        for (let x of changes) {
          if (x.added.length > 0)
            await storage.segments.addToSegment(segmentName, x.added);

          if (x.removed.length > 0)
            await storage.segments.removeFromSegment(segmentName, x.removed);

          if (x.added.length > 0 || x.removed.length > 0) {
            await storage.segments.setChangeNumber(segmentName, x.till);
            changeNumber = x.till;
          }

          log('Processed %s with till = %s added %s removed %s', segmentName, x.till, x.added.length, x.removed.length);
        }

        return changeNumber;
      }));
    }

    return Promise.all(updaters).then(shouldUpdateFlags => {
      if (shouldUpdateFlags.findIndex(v => v !== -1) !== -1 || readyOnAlreadyExistentState) {
        readyOnAlreadyExistentState = false;
        readiness.segments.emit(readiness.Events.SDK_SEGMENTS_ARRIVED);
      }
    });
  };

};

module.exports = SegmentChangesUpdaterFactory;
