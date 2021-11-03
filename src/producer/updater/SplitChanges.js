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

import logFactory from '../../utils/logger';
const log = logFactory('splitio-producer:split-changes');
import splitChangesFetcher from '../fetcher/SplitChanges';
import parseSegments from '../../engine/parser/segments';
import { SplitError } from '../../utils/lang/Errors';
import { _Set, setToArray } from '../../utils/lang/Sets';
import thenable from '../../utils/promise/thenable';

// For server-side segments storage, returns true if all registered segments have been fetched (changeNumber !== -1)
function checkAllSegmentsExist(segmentsStorage) {
  return segmentsStorage.getRegisteredSegments().every(segmentName => segmentsStorage.getChangeNumber(segmentName) !== -1);
}

function computeSplitsMutation(entries) {
  const computed = entries.reduce((accum, split) => {
    if (split.status === 'ACTIVE') {
      accum.added.push([split.name, JSON.stringify(split)]);

      parseSegments(split.conditions).forEach(segmentName => {
        accum.segments.add(segmentName);
      });
    } else {
      accum.removed.push(split.name);
    }

    return accum;
  }, {
    added: [],
    removed: [],
    segments: new _Set()
  });

  computed.segments = setToArray(computed.segments);

  return computed;
}

export default function SplitChangesUpdaterFactory(context, isNode = false) {
  const {
    [context.constants.SETTINGS]: settings,
    [context.constants.READINESS]: readiness,
    [context.constants.STORAGE]: storage,
    [context.constants.COLLECTORS]: metricCollectors
  } = context.getAll();
  const splitsEventEmitter = readiness.splits;

  let startingUp = true;
  let readyOnAlreadyExistentState = true;

  /**
   * Split updater returns a promise that resolves with a `false` boolean value if it fails to fetch splits or synchronize them with the storage.
   *
   * @param {number | undefined} retry current number of retry attemps. this param is only set by SplitChangesUpdater itself.
   * @param {boolean | undefined} noCache true to revalidate data to fetch
   */
  return function SplitChangesUpdater(retry = 0, noCache) {

    function splitChanges(since) {
      log.debug(`Spin up split update using since = ${since}`);

      const fetcherPromise = splitChangesFetcher(settings, since, startingUp, metricCollectors, isNode, noCache)
        .then(splitChanges => {
          startingUp = false;

          const mutation = computeSplitsMutation(splitChanges.splits);

          log.debug(`New splits ${mutation.added.length}`);
          log.debug(`Removed splits ${mutation.removed.length}`);
          log.debug(`Segment names collected ${mutation.segments}`);

          // Write into storage
          // @TODO if allowing custom storages, wrap errors as SplitErrors to distinguish from user callback errors
          return Promise.all([
            // calling first `setChangenumber` method, to perform cache flush if split filter queryString changed
            storage.splits.setChangeNumber(splitChanges.till),
            storage.splits.addSplits(mutation.added),
            storage.splits.removeSplits(mutation.removed),
            storage.segments.registerSegments(mutation.segments)
          ]).then(() => {
            // On server-side SDK, we must check that all registered segments have been fetched
            if (readyOnAlreadyExistentState || (since !== splitChanges.till && (!isNode || checkAllSegmentsExist(storage.segments)))) {
              readyOnAlreadyExistentState = false;
              splitsEventEmitter.emit(splitsEventEmitter.SDK_SPLITS_ARRIVED);
            }
          });
        })
        .catch(error => {
          // handle user callback errors
          if (!(error instanceof SplitError)) {
            setTimeout(() => { throw error; }, 0);
            startingUp = false; // Stop retrying.
          }

          log.warn(`Error while doing fetch of Splits. ${error}`);

          if (startingUp && settings.startup.retriesOnFailureBeforeReady > retry) {
            retry += 1;
            log.info(`Retrying download of splits #${retry}. Reason: ${error}`);
            return SplitChangesUpdater(retry, noCache);
          } else {
            startingUp = false;
          }

          return false;
        });

      // After triggering the requests, if we have cached splits information let's notify
      // that asynchronously, to let attach a listener for SDK_READY_FROM_CACHE
      if (startingUp && storage.splits.checkCache()) {
        setTimeout(splitsEventEmitter.emit(splitsEventEmitter.SDK_SPLITS_CACHE_LOADED), 0);
      }

      return fetcherPromise;
    }

    // @TODO check why e2e tests take so much time when sync storage result is not handled in a promise
    const since = storage.splits.getChangeNumber();
    const sincePromise = thenable(since) ? since : Promise.resolve(since);
    return sincePromise.then(splitChanges);
  };
}
