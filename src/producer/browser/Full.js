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
import TaskFactory from '../task';
import SplitChangesUpdater from '../updater/SplitChanges';
import MySegmentsUpdater from '../updater/MySegments';
import onSplitsArrivedFactory from './onSplitsArrivedFactory';

const log = logFactory('splitio-producer:updater');

/**
 * Startup all the background jobs required for a Browser SDK instance.
 */
const FullBrowserProducer = (context) => {
  const splitsUpdater = SplitChangesUpdater(context);
  const mySegmentsUpdater = MySegmentsUpdater(context);

  let isSynchronizingSplits = false;
  let isSynchronizingMySegments = false;

  function synchronizeSplits() {
    isSynchronizingSplits = true;
    return splitsUpdater().finally(function() {
      isSynchronizingSplits = false;
    });
  }

  function synchronizeMySegments(segmentList) {
    isSynchronizingMySegments = true;
    return mySegmentsUpdater(undefined, segmentList).finally(function () {
      isSynchronizingMySegments = false;
    });
  }

  const settings = context.get(context.constants.SETTINGS);
  const { splits: splitsEventEmitter } = context.get(context.constants.READINESS);

  const splitsUpdaterTask = TaskFactory(synchronizeSplits, settings.scheduler.featuresRefreshRate);
  const mySegmentsUpdaterTask = TaskFactory(mySegmentsUpdater, settings.scheduler.segmentsRefreshRate);

  const onSplitsArrived = onSplitsArrivedFactory(mySegmentsUpdaterTask, context);

  splitsEventEmitter.on(splitsEventEmitter.SDK_SPLITS_ARRIVED, onSplitsArrived);

  return {
    /**
     * @param {boolean} notStartImmediately if true, fetcher calls are scheduled but not run immediately
     */
    start(notStartImmediately) {
      log.info('Starting BROWSER producer');

      splitsUpdaterTask.start(notStartImmediately);
      mySegmentsUpdaterTask.start(notStartImmediately);
    },

    stop() {
      log.info('Stopping BROWSER producer');

      splitsUpdaterTask.stop();
      mySegmentsUpdaterTask && mySegmentsUpdaterTask.stop();
    },

    // Used by SyncManager to know if running in polling mode.
    isRunning: splitsUpdaterTask.isRunning,

    // Used by SplitUpdateWorker
    isSynchronizingSplits() {
      return isSynchronizingSplits;
    },
    synchronizeSplits,

    // Used by MySegmentUpdateWorker
    isSynchronizingMySegments() {
      return isSynchronizingMySegments;
    },
    synchronizeMySegments,
  };
};

export default FullBrowserProducer;