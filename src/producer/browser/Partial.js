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

import TaskFactory from '../task';
import MySegmentsUpdater from '../updater/MySegments';
import onSplitsArrivedFactory from './onSplitsArrivedFactory';

/**
 * Incremental updater to be used to share data in the browser.
 */
const PartialBrowserProducer = (context) => {
  const settings = context.get(context.constants.SETTINGS);
  const { splits: splitsEventEmitter } = context.get(context.constants.READINESS);

  const mySegmentsUpdater = MySegmentsUpdater(context);
  const mySegmentsUpdaterTask = TaskFactory(mySegmentsUpdater, settings.scheduler.segmentsRefreshRate);

  const onSplitsArrived = onSplitsArrivedFactory(mySegmentsUpdaterTask, context);

  splitsEventEmitter.on(splitsEventEmitter.SDK_SPLITS_ARRIVED, onSplitsArrived);

  let isSynchronizingMySegments = false;

  function synchronizeMySegments(segmentList) {
    isSynchronizingMySegments = true;
    return mySegmentsUpdater(undefined, segmentList).finally(function () {
      isSynchronizingMySegments = false;
    });
  }

  return {
    start: mySegmentsUpdaterTask.start,
    stop: mySegmentsUpdaterTask.stop,

    // Used by SyncManager to know if running in polling mode.
    isRunning: mySegmentsUpdaterTask.isRunning,

    // Used by MySegmentUpdateWorker
    isSynchronizingMySegments() {
      return isSynchronizingMySegments;
    },
    synchronizeMySegments,
  };
};

export default PartialBrowserProducer;