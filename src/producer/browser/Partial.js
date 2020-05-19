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
  const splitsStorage = context.get(context.constants.STORAGE).splits;
  const { splits: splitsEventEmitter, segments: segmentsEventEmitter } = context.get(context.constants.READINESS);

  const mySegmentsUpdater = MySegmentsUpdater(context);
  const mySegmentsUpdaterTask = TaskFactory(synchronizeMySegments, settings.scheduler.segmentsRefreshRate);

  const onSplitsArrived = onSplitsArrivedFactory(mySegmentsUpdaterTask, context);

  let isSynchronizingMySegments = false;

  /**
   * @param {string[] | undefined} segmentList might be undefined
   */
  function synchronizeMySegments(segmentList) {
    isSynchronizingMySegments = true;
    return mySegmentsUpdater(0, segmentList).finally(function () {
      isSynchronizingMySegments = false;
    });
  }

  // @TODO move this logic back to onSplitsArrived
  function checkSplitUsingSegments() {
    const isReady = context.get(context.constants.READY, true);
    if (!splitsStorage.usesSegments() && !isReady) segmentsEventEmitter.emit(segmentsEventEmitter.SDK_SEGMENTS_ARRIVED);
  }
  if (splitsStorage.getChangeNumber() !== -1) {
    setTimeout(checkSplitUsingSegments, 0);
  } else {
    splitsEventEmitter.on(splitsEventEmitter.SDK_SPLITS_ARRIVED, checkSplitUsingSegments);
  }

  return {
    // Start periodic fetching (polling)
    start() {
      if (splitsStorage.usesSegments()) mySegmentsUpdaterTask.start();
      // @TODO consider removing next line if onSplitsArrived knows the synchronization mode
      splitsEventEmitter.on(splitsEventEmitter.SDK_SPLITS_ARRIVED, onSplitsArrived);
    },

    // Stop periodic fetching (polling)
    stop() {
      mySegmentsUpdaterTask.stop();
      // @TODO consider removing next line if onSplitsArrived knows the synchronization mode
      splitsEventEmitter.removeListener(splitsEventEmitter.SDK_SPLITS_ARRIVED, onSplitsArrived);
    },

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