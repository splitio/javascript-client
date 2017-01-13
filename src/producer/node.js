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

const log = require('debug')('splitio-producer:updater');
const repeat = require('../utils/fn/repeat');

const SplitChangesUpdater = require('./updater/SplitChanges');
const SegmentChangesUpdater = require('./updater/SegmentChanges');

/**
 * Expose start / stop mechanism for pulling data from services.
 */
const NodeUpdater = (settings: Object, hub: EventEmitter, storage: SplitStorage): Startable => {
  const splitsUpdater = SplitChangesUpdater(settings, hub, storage);
  const segmentsUpdater = SegmentChangesUpdater(settings, hub, storage);

  let stopSplitsUpdate;
  let stopSegmentsUpdate;
  let splitFetchCompleted = false;

  return {
    start() {
      log('Starting NODEJS updater');
      log('Splits will be refreshed each %s millis', settings.scheduler.featuresRefreshRate);
      log('Segments will be refreshed each %s millis', settings.scheduler.segmentsRefreshRate);

      stopSplitsUpdate = repeat(
        scheduleSplitsUpdate => {
          log('Fetching splits');
          splitsUpdater().then(() => {
            splitFetchCompleted = true;
            scheduleSplitsUpdate();
          });
        },
        settings.scheduler.featuresRefreshRate
      );

      stopSegmentsUpdate = repeat(
        scheduleSegmentsUpdate => {
          if (splitFetchCompleted) {
            log('Fetching segments');
            segmentsUpdater().then(() => scheduleSegmentsUpdate());
          } else {
            scheduleSegmentsUpdate();
          }
        },
        settings.scheduler.segmentsRefreshRate
      );
    },

    stop() {
      log('Stopping NODEJS updater');

      stopSplitsUpdate && stopSplitsUpdate();
      stopSegmentsUpdate && stopSegmentsUpdate();
    }
  };
};

module.exports = NodeUpdater;
