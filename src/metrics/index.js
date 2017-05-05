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

const log = require('../utils/logger')('splitio-metrics');
const tracker = require('../utils/logger/timeTracker');

const repeat = require('../utils/fn/repeat');

const metricsService = require('../services/metrics');
const metricsServiceRequest = require('../services/metrics/post');
const metricsDTO = require('../services/metrics/dto');

const impressionsService = require('../services/impressions');
const impressionsBulkRequest = require('../services/impressions/bulk');
const impressionsDTO = require('../services/impressions/dto');

const MetricsFactory = (settings: Object, storage: SplitStorage): Startable => {
  const pushMetrics = (): Promise<void> => {
    if (storage.metrics.isEmpty()) return Promise.resolve();

    log.info('Pushing metrics');
    tracker.start('Pushing metrics');

    return metricsService(metricsServiceRequest(settings, {
      body: JSON.stringify(metricsDTO.fromGetTreatmentCollector(storage.metrics))
    }))
    .then(() => {
      tracker.stop('Pushing metrics');
      return storage.metrics.clear();
    })
    .catch(() => storage.metrics.clear());
  };

  const pushImpressions = (): Promise<void> => {
    if (storage.impressions.isEmpty()) return Promise.resolve();

    log.info(`Pushing ${storage.impressions.queue.length} impressions`);
    tracker.start('Pushing impressions');

    return impressionsService(impressionsBulkRequest(settings, {
      body: JSON.stringify(impressionsDTO.fromImpressionsCollector(storage.impressions))
    }))
    .then(() => {
      tracker.stop('Pushing impressions');
      return storage.impressions.clear();
    })
    .catch(() => storage.impressions.clear());
  };

  let stopImpressionsPublisher = false;
  let stopPerformancePublisher = false;

  return {
    start() {
      stopImpressionsPublisher = repeat(
        schedulePublisher => pushImpressions().then(() => schedulePublisher()),
        settings.scheduler.impressionsRefreshRate
      );

      stopPerformancePublisher = repeat(
        schedulePublisher => pushMetrics().then(() => schedulePublisher()),
        settings.scheduler.metricsRefreshRate
      );
    },

    stop() {
      stopImpressionsPublisher && stopImpressionsPublisher();
      stopPerformancePublisher && stopPerformancePublisher();
    }
  };
};

module.exports = MetricsFactory;
