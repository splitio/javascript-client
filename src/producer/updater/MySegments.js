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

  // @TODO when modularizing storage, handle possible errors and async execution of storage.segments.resetSegments
  function updateSegments(segments) {
    // Update the list of segment names available
    const shouldNotifyUpdate = storage.segments.resetSegments(segments);

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
   * @param {string[] | undefined} segmentList list of mySegment names to sync in the storage. If the list is `undefined`, it fetches them before syncing in the storage.
   */
  return function MySegmentsUpdater(retry = 0, segmentList) {
    // If segmentList is provided, there is no need to fetch mySegments
    if (segmentList) {
      updateSegments(segmentList);
      return Promise.resolve();
    }

    // NOTE: We only collect metrics on startup.
    return mySegmentsFetcher(settings, startingUp, metricCollectors).then(segments => {
      // Only when we have downloaded segments completely, we should not keep
      // retrying anymore
      startingUp = false;

      updateSegments(segments);
    })
      .catch(error => {
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
