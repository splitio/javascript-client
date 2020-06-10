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
import thenable from '../../utils/promise/thenable';

function computeSplitsMutation(entries) {
  const computed = entries.reduce((accum, split) => {
    if (split.status === 'ACTIVE') {
      accum.added.push([split.name, JSON.stringify(split)]);

      for (let segmentName in parseSegments(split.conditions)) {
        accum.segments[segmentName] = true;
      }
    } else {
      accum.removed.push(split.name);
    }

    return accum;
  }, {
    added: [],
    removed: [],
    segments: {}
  });

  computed.segments = Object.keys(computed.segments);

  return computed;
}

function SplitChangesUpdaterFactory(context, isNode = false) {
  const {
    [context.constants.SETTINGS]: settings,
    [context.constants.READINESS]: readiness,
    [context.constants.STORAGE]: storage,
    [context.constants.COLLECTORS]: metricCollectors
  } = context.getAll();
  const splitsEventEmitter = readiness.splits;

  let startingUp = true;
  let readyOnAlreadyExistentState = true;

  return function SplitChangesUpdater(retry = 0) {

    function splitChanges(since) {
      log.debug(`Spin up split update using since = ${since}`);

      const fetcherPromise = splitChangesFetcher(settings, since, startingUp, metricCollectors, isNode)
        .then(splitChanges => {
          startingUp = false;

          const mutation = computeSplitsMutation(splitChanges.splits);

          log.debug(`New splits ${mutation.added.length}`);
          log.debug(`Removed splits ${mutation.removed.length}`);
          log.debug(`Segment names collected ${mutation.segments}`);

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
          if (!(error instanceof SplitError)) {
            setTimeout(() => { throw error; }, 0);
            startingUp = false; // Stop retrying.
          }

          log.warn(`Error while doing fetch of Splits ${error}`);

          if (startingUp && settings.startup.retriesOnFailureBeforeReady > retry) {
            retry += 1;
            log.info(`Retrying download of splits #${retry}. Reason: ${error}`);
            return SplitChangesUpdater(retry);
          } else {
            startingUp = false;
          }

          return false;
        });

      // After triggering the requests, if we have cached splits information let's notify that.
      if (startingUp && storage.splits.checkCache()) splitsEventEmitter.emit(splitsEventEmitter.SDK_SPLITS_CACHE_LOADED);

      return fetcherPromise;
    }

    // @TODO check why e2e tests take so much time when sync storage result is not handled in a promise
    const since = storage.splits.getChangeNumber();
    const sincePromise = thenable(since) ? since.then(splitChanges) : Promise.resolve(since);
    return sincePromise.then(splitChanges);
  };
}

export default SplitChangesUpdaterFactory;
