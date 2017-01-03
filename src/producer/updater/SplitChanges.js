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

const log = require('debug')('splitio-producer:split-changes');
const splitChangesFetcher = require('../fetcher/SplitChanges');

const parseSegments = require('../../engine/parser/segments');

function SplitChangesUpdater(settings: Object, hub: EventEmitter, storage: SplitStorage) {
  let startingUp = true;
  let readyOnAlreadyExistentState = true;

  return async function updater(retry: number = 0) {
    const since: number = await storage.splits.getChangeNumber();

    log('Spin up split update using since = %s', since);

    return splitChangesFetcher(settings, since, startingUp).then(splitChanges => {
      startingUp = false;

      // Quick data preparation phase
      const tuples = splitChanges.splits.reduce((accum, split) => {
        accum.keys.push(split.name);
        accum.values.push(JSON.stringify(split));

        for (let segmentName of parseSegments(split.conditions)) {
          accum.segments.add(segmentName);
        }

        return accum;
      }, { keys: [], values: [], segments: new Set() });

      tuples.segments = [...tuples.segments];

      log('Split names collected: ', tuples.keys);
      log('Segment names collected: ', tuples.segments);

      // Write into storage
      return Promise.all([
        storage.splits.addSplits(tuples.keys, tuples.values),
        storage.splits.setChangeNumber(splitChanges.till),
        storage.segments.registerSegments(tuples.segments)
      ]).then(() => {
        if (since !== splitChanges.till || readyOnAlreadyExistentState) {
          readyOnAlreadyExistentState = false;
          hub.emit(hub.SDK_SPLITS_ARRIVED);
        }
      });
    })
    .catch(error => {
      log('Error while doing fetch of Splits %s', error);

      if (startingUp && settings.startup.retriesOnFailureBeforeReady > retry) {
        retry += 1;
        log('Retrying download of splits #%s reason %s', retry, error);
        return updater(retry);
      } else {
        startingUp = false;
      }

      return false;
    });
  };
}

module.exports = SplitChangesUpdater;
