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
import { SplitError } from '../../utils/lang/Errors';
const log = logFactory('splitio-producer:my-segments');
import mySegmentsFetcher from '../fetcher/MySegments';

export default function MySegmentsUpdaterFactory(context) {
  const {
    [context.constants.SETTINGS]: settings,
    [context.constants.READINESS]: readiness,
    [context.constants.STORAGE]: storage,
    [context.constants.COLLECTORS]: metricCollectors
  } = context.getAll();

  const segmentsEventEmitter = readiness.segments;

  let readyOnAlreadyExistentState = true;
  let startingUp = true;

  // @TODO if allowing custom storages, handle async execution and wrap errors as SplitErrors to distinguish from user callback errors
  function updateSegments(segmentsData) {

    const mySegmentsCache = storage.segments;
    let shouldNotifyUpdate;
    if (Array.isArray(segmentsData)) {
      // Update the list of segment names available
      shouldNotifyUpdate = mySegmentsCache.resetSegments(segmentsData);
    } else {
      // Add/Delete the segment
      const { name, add } = segmentsData;
      if (mySegmentsCache.isInSegment(name) !== add) {
        shouldNotifyUpdate = true;
        if (add) mySegmentsCache.addToSegment(name);
        else mySegmentsCache.removeFromSegment(name);
      } else {
        shouldNotifyUpdate = false;
      }
    }

    // Notify update if required
    if (storage.splits.usesSegments() && (shouldNotifyUpdate || readyOnAlreadyExistentState)) {
      readyOnAlreadyExistentState = false;
      segmentsEventEmitter.emit(segmentsEventEmitter.SDK_SEGMENTS_ARRIVED);
    }
  }

  /**
   * MySegments updater returns a promise that resolves with a `false` boolean value if it fails to fetch mySegments or synchronize them with the storage.
   *
   * @param {number | undefined} retry current number of retry attemps. this param is only set by SplitChangesUpdater itself.
   * @param {string[] | { name: string, add: boolean } | undefined} segmentsData it can be:
   *  (1) the list of segment names to sync in the storage,
   *  (2) an object with a segment name and action (true: add, or false: delete) to update the storage,
   *  (3) or `undefined`, for which the updater will fetch mySegments in order to sync the storage.
   * @param {boolean | undefined} noCache true to revalidate data to fetch
   */
  return function MySegmentsUpdater(retry = 0, segmentsData, noCache) {
    let updaterPromise;

    if (segmentsData) {
      // If segmentsData is provided, there is no need to fetch mySegments
      updaterPromise = new Promise((res) => { updateSegments(segmentsData); res(); });
    } else {
      // NOTE: We only collect metrics on startup.
      updaterPromise = mySegmentsFetcher(settings, startingUp, metricCollectors, noCache).then(segments => {
        // Only when we have downloaded segments completely, we should not keep retrying anymore
        startingUp = false;

        updateSegments(segments);
      });
    }

    return updaterPromise.catch(error => {
      // handle user callback errors
      if (!(error instanceof SplitError)) setTimeout(() => { throw error; }, 0);

      if (startingUp && settings.startup.retriesOnFailureBeforeReady > retry) {
        retry += 1;
        log.warn(`Retrying download of segments #${retry}. Reason: ${error}`);
        return MySegmentsUpdater(retry);
      } else {
        startingUp = false;
      }

      return false; // shouldUpdate = false
    });
  };

}
