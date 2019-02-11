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
import SplitNetworkError from '../../services/transport/SplitNetworkError';
const log = logFactory('splitio-producer:my-segments');
import mySegmentsFetcher from '../fetcher/MySegments';

function MySegmentsUpdaterFactory(context) {
  const {
    [context.constants.SETTINGS]: settings,
    [context.constants.READINESS]: readiness,
    [context.constants.STORAGE]: storage,
    [context.constants.COLLECTORS]: metricCollectors
  } = context.getAll();

  const segmentsEventEmitter = readiness.segments;

  let readyOnAlreadyExistentState = true;
  let startingUp = true;

  return function MySegmentsUpdater(retry = 0) {
    // NOTE: We only collect metrics on startup.
    return mySegmentsFetcher(settings, startingUp, metricCollectors).then(segments => {
      // Only when we have downloaded segments completely, we should not keep
      // retrying anymore
      startingUp = false;

      // Update the list of segment names available
      const shouldNotifyUpdate = storage.segments.resetSegments(segments);

      // Notify update if required
      if (shouldNotifyUpdate || readyOnAlreadyExistentState) {
        readyOnAlreadyExistentState = false;
        segmentsEventEmitter.emit(segmentsEventEmitter.SDK_SEGMENTS_ARRIVED);
      }
    })
      .catch(error => {
        if (!(error instanceof SplitNetworkError)) setTimeout(() => {throw error;}, 0);

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

export default MySegmentsUpdaterFactory;
