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

import logFactory from '../utils/logger';
import TaskFactory from './task';
import SplitChangesUpdater from './updater/SplitChanges';
import PartialBrowserProducer from './browser/Partial';

const log = logFactory('splitio-producer:updater');

/**
 * Startup all the background jobs required for a Browser SDK instance.
 */
const FullBrowserProducer = (context) => {
  const settings = context.get(context.constants.SETTINGS);

  const splitsUpdater = SplitChangesUpdater(context);

  const splitsUpdaterTask = TaskFactory(synchronizeSplits, settings.scheduler.featuresRefreshRate);

  const mySegmentsProducer = PartialBrowserProducer(context);

  let isSynchronizingSplits = false;

  /**
   * @param {boolean | undefined} noCache true to revalidate data to fetch
   */
  function synchronizeSplits(noCache) {
    isSynchronizingSplits = true;
    // `splitsUpdater` promise always resolves, and with a false value if it fails to fetch or store splits
    return splitsUpdater(0, noCache).then(function (res) {
      isSynchronizingSplits = false;
      return res;
    });
  }

  return {
    // Start periodic fetching (polling)
    start() {
      log.info('Starting BROWSER producer');

      splitsUpdaterTask.start();
      mySegmentsProducer.start();
    },

    // Stop periodic fetching (polling)
    stop() {
      log.info('Stopping BROWSER producer');

      splitsUpdaterTask.stop();
      mySegmentsProducer.stop();
    },

    // Used by SyncManager to know if running in polling mode.
    isRunning: splitsUpdaterTask.isRunning,

    // Used by SplitUpdateWorker
    isSynchronizingSplits() {
      return isSynchronizingSplits;
    },
    synchronizeSplits,

    // Used by MySegmentUpdateWorker
    isSynchronizingMySegments: mySegmentsProducer.isSynchronizingMySegments,
    synchronizeMySegments: mySegmentsProducer.synchronizeMySegments,
  };
};

export default FullBrowserProducer;