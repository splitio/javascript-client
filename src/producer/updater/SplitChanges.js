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

type SplitMutation = {
  added: Array<[string, string]>,
  removed: Array<string>,
  segments: Array<string> | Set<string>
};

const log = require('debug')('splitio-producer:split-changes');
const splitChangesFetcher = require('../fetcher/SplitChanges');

const parseSegments = require('../../engine/parser/segments');

function computeSplitsMutation(entries: Array<SplitObject>): SplitMutation {
  const computed = entries.reduce((accum, split) => {
    if (split.status === 'ACTIVE') {
      accum.added.push([split.name, JSON.stringify(split)]);

      for (let segmentName of parseSegments(split.conditions)) {
        accum.segments.add(segmentName);
      }
    } else {
      accum.removed.push(split.name);
    }

    return accum;
  }, {
    added: [],
    removed: [],
    segments: new Set()
  });

  computed.segments = [...computed.segments];

  return computed;
}

function SplitChangesUpdaterFactory(settings: Object, readiness: ReadinessGate, storage: SplitStorage) {
  const splitsEventEmitter = readiness.splits;

  let startingUp = true;
  let readyOnAlreadyExistentState = true;

  return async function SplitChangesUpdater(retry: number = 0) {
    const since: number = await storage.splits.getChangeNumber();

    log('Spin up split update using since = %s', since);

    return splitChangesFetcher(settings, since, startingUp).then(splitChanges => {
      startingUp = false;

      const mutation = computeSplitsMutation(splitChanges.splits);

      log('New splits %s', mutation.added.length);
      log('Removed splits %s', mutation.removed.length);
      log('Segment names collected %s', mutation.segments);

      // Write into storage
      return Promise.all([
        storage.splits.addSplits(mutation.added),
        storage.splits.removeSplits(mutation.removed),
        storage.splits.setChangeNumber(splitChanges.till),
        storage.segments.registerSegments(mutation.segments)
      ]).then(() => {
        if (since !== splitChanges.till || readyOnAlreadyExistentState) {
          readyOnAlreadyExistentState = false;
          splitsEventEmitter.emit(splitsEventEmitter.SDK_SPLITS_ARRIVED);
        }
      });
    })
    .catch(error => {
      log('Error while doing fetch of Splits %s', error);

      if (startingUp && settings.startup.retriesOnFailureBeforeReady > retry) {
        retry += 1;
        log('Retrying download of splits #%s reason %s', retry, error);
        return SplitChangesUpdater(retry);
      } else {
        startingUp = false;
      }

      return false;
    });
  };
}

module.exports = SplitChangesUpdaterFactory;
