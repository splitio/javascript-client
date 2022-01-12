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
const log = logFactory('splitio-producer:updater');
import repeat from '../utils/fn/repeat';
import SplitChangesUpdater from './updater/SplitChanges';
import SegmentChangesUpdater from './updater/SegmentChanges';

/**
 * Expose start / stop mechanism for pulling data from services.
 */
const NodeUpdater = (context) => {
  const splitsUpdater = SplitChangesUpdater(context, true /* tell split updater we are in node */);
  const segmentsUpdater = SegmentChangesUpdater(context);
  const settings = context.get(context.constants.SETTINGS);

  let stopSplitsUpdate = false;
  let stopSegmentsUpdate = false;
  let splitFetchCompleted = false;
  let isRunning = false;
  let isSynchronizingSplits = false;
  let isSynchronizingSegments = false;

  /**
   * @param {boolean | undefined} noCache true to revalidate data to fetch
   */
  function synchronizeSplits(noCache) {
    isSynchronizingSplits = true;
    // `splitsUpdater` promise always resolves, and with a false value if it fails to fetch or store splits
    return splitsUpdater(0, noCache).then(function (res) {
      // Mark splits as ready (track first successfull call to start downloading segments)
      splitFetchCompleted = true;
      isSynchronizingSplits = false;
      return res;
    });
  }

  /**
   * @param {string[] | undefined} segmentNames list of segment names to fetch. By passing `undefined` it fetches the list of segments registered at the storage
   * @param {boolean | undefined} noCache true to revalidate data to fetch on a SEGMENT_UPDATE notifications.
   * @param {boolean | undefined} fetchOnlyNew if true, only fetch the segments that not exists, i.e., which `changeNumber` is equal to -1.
   * This param is used by SplitUpdateWorker on server-side SDK, to fetch new registered segments on SPLIT_UPDATE notifications.
   */
  function synchronizeSegment(segmentNames, noCache, fetchOnlyNew) {
    isSynchronizingSegments = true;
    // `segmentsUpdater` promise always resolves, and with a false value if it fails to fetch or store some segment
    return segmentsUpdater(segmentNames, noCache, fetchOnlyNew).then(function (res) {
      isSynchronizingSegments = false;
      return res;
    });
  }

  return {
    // Start periodic fetching (polling)
    start() {
      log.info('Starting NODEJS updater');
      log.debug(`Splits will be refreshed each ${settings.scheduler.featuresRefreshRate} millis`);
      log.debug(`Segments will be refreshed each ${settings.scheduler.segmentsRefreshRate} millis`);

      // Schedule incremental update of segments only if needed
      const spinUpSegmentUpdater = () => {
        // We must check that Split polling is running (i.e. `stopSplitsUpdate !== false`),
        // in case that `spinUpSegmentUpdater` is called once the client has been destroyed.
        if (stopSplitsUpdate && !stopSegmentsUpdate) {
          stopSegmentsUpdate = repeat(
            scheduleSegmentsUpdate => {
              if (splitFetchCompleted) {
                log.debug('Fetching segments');
                synchronizeSegment().then(() => scheduleSegmentsUpdate());
              } else {
                scheduleSegmentsUpdate();
              }
            },
            settings.scheduler.segmentsRefreshRate
          );
        }
      };

      stopSplitsUpdate = repeat(
        scheduleSplitsUpdate => {
          log.debug('Fetching splits');

          synchronizeSplits()
            .then(() => {
              // Spin up the segments update if needed
              spinUpSegmentUpdater();
              // Re-schedule update
              scheduleSplitsUpdate();
            });
        },
        settings.scheduler.featuresRefreshRate
      );

      isRunning = true;
    },

    // Stop periodic fetching (polling)
    stop() {
      log.info('Stopping NODEJS updater');

      stopSplitsUpdate && stopSplitsUpdate();
      stopSplitsUpdate = false; // Mark polling stopped, to be able to call `start` again and to avoid polling segments if `spinUpSegmentUpdater` is called after the client has been destroyed.
      stopSegmentsUpdate && stopSegmentsUpdate();
      stopSegmentsUpdate = false;

      isRunning = false;
    },

    // Used by SyncManager to know if running in polling mode.
    isRunning() {
      return isRunning;
    },

    // Used by SplitUpdateWorker
    isSynchronizingSplits() {
      return isSynchronizingSplits;
    },
    synchronizeSplits,

    // Used by SegmentUpdateWorker
    isSynchronizingSegments() {
      return isSynchronizingSegments;
    },
    synchronizeSegment
  };
};

export default NodeUpdater;