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

const log = require('../../utils/logger')('splitio-producer:updater');

const TaskFactory = require('../task');

const SplitChangesUpdater = require('../updater/SplitChanges');
const MySegmentsUpdater = require('../updater/MySegments');

/**
 * Startup all the background jobs required for a Browser SDK instance.
 */
const FullBrowserProducer = (settings: Object, readiness: ReadinessGate, storage: SplitStorage): Startable => {
  const splitsUpdater = SplitChangesUpdater(settings, readiness, storage);
  const segmentsUpdater = MySegmentsUpdater(settings, readiness, storage);

  const splitsUpdaterTask = TaskFactory(splitsUpdater, settings.scheduler.featuresRefreshRate);
  const segmentsUpdaterTask = TaskFactory(segmentsUpdater, settings.scheduler.segmentsRefreshRate);

  return {
    start() {
      log.info('Starting BROWSER producer');

      splitsUpdaterTask.start();
      segmentsUpdaterTask.start();
    },

    stop() {
      log.info('Stopping BROWSER producer');

      splitsUpdaterTask.stop();
      segmentsUpdaterTask.stop();
    }
  };
};

module.exports = FullBrowserProducer;
