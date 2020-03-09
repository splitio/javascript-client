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

  return {
    start() {
      log.info('Starting NODEJS updater');
      log.debug(`Splits will be refreshed each ${settings.scheduler.featuresRefreshRate} millis`);
      log.debug(`Segments will be refreshed each ${settings.scheduler.segmentsRefreshRate} millis`);

      // Schedule incremental update of segments only if needed
      const spinUpSegmentUpdater = () => {
        if (!stopSegmentsUpdate) {
          stopSegmentsUpdate = repeat(
            scheduleSegmentsUpdate => {
              if (splitFetchCompleted) {
                log.debug('Fetching segments');
                segmentsUpdater().then(() => scheduleSegmentsUpdate());
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

          splitsUpdater()
            .then(() => {
              // Mark splits as ready (track first successfull call to start downloading segments)
              splitFetchCompleted = true;
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

    stop() {
      log.info('Stopping NODEJS updater');

      stopSplitsUpdate && stopSplitsUpdate();
      stopSegmentsUpdate && stopSegmentsUpdate();

      isRunning = false;
    },

    // Used by SyncManager to know if running in polling mode.
    isRunning() {
      return isRunning;
    },

    // Synchronous call to SplitsUpdater and MySegmentsUpdater, used in PUSH mode by queues/workers.
    callSplitsUpdater(changeNumber) {
      if(changeNumber) {
        // @TODO check if changeNumber is older
        return;
      }

      splitsUpdater().then(() => {
        // Mark splits as ready (track first successfull call to start downloading segments)
        splitFetchCompleted = true;
      });
    },

    callSegmentsUpdater(changeNumber, segmentName) {
      if(changeNumber) {
        // @TODO check if changeNumber is older
        return;
      }

      // @TODO
      segmentName;
      segmentsUpdater();
    },

    callKillSplit(changeNumber, splitName, defaultTreatment) {
      if(changeNumber) {
        // @TODO check if changeNumber is older
        return;
      }

      // @TODO
      splitName, defaultTreatment;
    }
  };
};

export default NodeUpdater;