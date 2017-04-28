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

// @flow

'use strict';

const log = require('../utils/logger')('splitio-producer:updater');
const repeat = require('../utils/fn/repeat');

const SplitChangesUpdater = require('./updater/SplitChanges');
const SegmentChangesUpdater = require('./updater/SegmentChanges');

/**
 * Expose start / stop mechanism for pulling data from services.
 */
const NodeUpdater = (settings: Object, hub: EventEmitter, storage: SplitStorage): Startable => {
  const splitsUpdater = SplitChangesUpdater(settings, hub, storage);
  const segmentsUpdater = SegmentChangesUpdater(settings, hub, storage);

  let stopSplitsUpdate = false;
  let stopSegmentsUpdate = false;
  let splitFetchCompleted = false;

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
    },

    stop() {
      log.info('Stopping NODEJS updater');

      stopSplitsUpdate && stopSplitsUpdate();
      stopSegmentsUpdate && stopSegmentsUpdate();
    }
  };
};

module.exports = NodeUpdater;
