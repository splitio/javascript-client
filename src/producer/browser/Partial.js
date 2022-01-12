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
import logFactory from '../../utils/logger';
const log = logFactory('splitio-producer:mySegmentsHandler');

/**
 * Incremental updater to be used to share data in the browser.
 */
const PartialBrowserProducer = (context) => {
  const settings = context.get(context.constants.SETTINGS);
  const splitsStorage = context.get(context.constants.STORAGE).splits;
  const { splits: splitsEventEmitter, segments: segmentsEventEmitter } = context.get(context.constants.READINESS);

  const mySegmentsUpdater = MySegmentsUpdater(context);
  const mySegmentsUpdaterTask = TaskFactory(synchronizeMySegments, settings.scheduler.segmentsRefreshRate);

  splitsEventEmitter.on(splitsEventEmitter.SDK_SPLITS_ARRIVED, smartPausing);
  // needed for shared clients, we run `smartReady` a first time if splits were sync and don't use segments,
  // to emit SDK_SEGMENTS_ARRIVED (and thus SDK_READY) immediately in next event cycle
  if (!splitsStorage.usesSegments()) setTimeout(smartReady, 0);
  else splitsEventEmitter.once(splitsEventEmitter.SDK_SPLITS_ARRIVED, smartReady);

  let isSynchronizingMySegments = false;

  /**
   * @param {string[] | undefined} segmentList might be undefined
   * @param {boolean | undefined} noCache true to revalidate data to fetch
   */
  function synchronizeMySegments(segmentList, noCache) {
    isSynchronizingMySegments = true;
    // `mySegmentsUpdater` promise always resolves, and with a false value if it fails to fetch or store mySegments
    return mySegmentsUpdater(0, segmentList, noCache).then(function (res) {
      isSynchronizingMySegments = false;
      return res;
    });
  }

  let running = false;
  // we cannot rely on `mySegmentsUpdaterTask.isRunning` to check if doing polling
  function isRunning() {
    return running;
  }

  // emit SDK_SEGMENTS_ARRIVED (and thus SDK_READY) if not ready yet and splits are not using segments
  function smartReady() {
    const isReady = context.get(context.constants.READY, true);
    if (!isReady && !splitsStorage.usesSegments()) segmentsEventEmitter.emit(segmentsEventEmitter.SDK_SEGMENTS_ARRIVED);
  }

  // smartly pause/resume mySegmentsUpdaterTask while doing polling
  function smartPausing() {
    if (!running) return; // noop if not doing polling
    const splitsHaveSegments = splitsStorage.usesSegments();
    if (splitsHaveSegments !== mySegmentsUpdaterTask.isRunning()) {
      log.info(`Turning segments data polling ${splitsHaveSegments ? 'ON' : 'OFF'}.`);
      if (splitsHaveSegments) {
        mySegmentsUpdaterTask.start();
      } else {
        mySegmentsUpdaterTask.stop();
      }
    }
  }

  return {
    // Start periodic fetching (polling)
    start() {
      running = true;
      if (splitsStorage.usesSegments()) mySegmentsUpdaterTask.start();
    },

    // Stop periodic fetching (polling)
    stop() {
      running = false;
      mySegmentsUpdaterTask.stop();
    },

    // Used by SyncManager to know if running in polling mode.
    isRunning,

    // Used by MySegmentUpdateWorker
    isSynchronizingMySegments() {
      return isSynchronizingMySegments;
    },
    synchronizeMySegments,
  };
};

export default PartialBrowserProducer;