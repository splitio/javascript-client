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
import tracker from '../utils/timeTracker';
import repeat from '../utils/fn/repeat';
import metricsService from '../services/metrics';
import metricsTimesServiceRequest from '../services/metrics/times';
import metricsCountersServiceRequest from '../services/metrics/counters';
import {
  fromLatenciesCollector,
  fromCountersCollector
} from '../services/metrics/dto';
import impressionsService from '../services/impressions';
import impressionsBulkRequest from '../services/impressions/bulk';
import impressionsCountRequest from '../services/impressions/count';
import {
  fromImpressionsCollector
} from '../services/impressions/dto';
import {
  SegmentChangesCollector,
  SplitChangesCollector,
  MySegmentsCollector,
  ClientCollector
} from './Collectors';
import { OPTIMIZED, STANDALONE_MODE } from '../utils/constants';

const log = logFactory('splitio-metrics');

const MetricsFactory = context => {
  let impressionsRetries = 0;
  const settings = context.get(context.constants.SETTINGS);
  const storage = context.get(context.constants.STORAGE);
  const impressionsCounter = context.get(context.constants.IMPRESSIONS_COUNTER);
  const shouldPushImpressionsCache = settings.sync.impressionsMode === OPTIMIZED && settings.mode === STANDALONE_MODE;

  const pushMetrics = () => {
    if (storage.metrics.isEmpty() && storage.count.isEmpty()) return Promise.resolve();

    log.info('Pushing metrics');
    const latencyTrackerStop = tracker.start(tracker.TaskNames.METRICS_PUSH);

    // POST latencies
    const latenciesPromise = storage.metrics.isEmpty() ? null : metricsService(
      metricsTimesServiceRequest(settings, {
        body: JSON.stringify(fromLatenciesCollector(storage.metrics))
      }))
      .then(() => storage.metrics.clear())
      .catch(() => storage.metrics.clear());

    // POST counters
    const countersPromise = storage.count.isEmpty() ? null : metricsService(
      metricsCountersServiceRequest(settings, {
        body: JSON.stringify(fromCountersCollector(storage.count))
      }))
      .then(() => storage.count.clear())
      .catch(() => storage.count.clear());

    return Promise.all([latenciesPromise, countersPromise]).then(resp => {
      // After both finishes, track the end and return the results
      latencyTrackerStop();
      return resp;
    });
  };

  const pushImpressions = () => {
    if (storage.impressions.isEmpty()) return Promise.resolve();
    const imprCount = storage.impressions.queue.length;

    log.info(`Pushing ${imprCount} impressions`);
    const latencyTrackerStop = tracker.start(tracker.TaskNames.IMPRESSIONS_PUSH);

    return impressionsService(impressionsBulkRequest(settings, {
      body: JSON.stringify(fromImpressionsCollector(storage.impressions, settings))
    }))
      .then(() => {
        impressionsRetries = 0;
        storage.impressions.clear();
      })
      .catch(err => {
        if (impressionsRetries) { // For now we retry only once.
          log.warn(`Droping ${imprCount} impressions after retry. Reason ${err}.`);
          impressionsRetries = 0;
          storage.impressions.clear();
        } else {
          impressionsRetries++;
          log.warn(`Failed to push ${imprCount} impressions, keeping data to retry on next iteration. Reason ${err}.`);
        }
      })
      .then(() => latencyTrackerStop());
  };

  const pushCachedImpressions = () => {
    const imprCount = impressionsCounter.size();
    if (!impressionsCounter || imprCount === 0) return Promise.resolve();

    log.info(`Pushing ${imprCount} impressions`);
    const latencyTrackerStop = tracker.start(tracker.TaskNames.IMPRESSIONS_COUNT);

    const pf = [];
    const cachedImpressions = impressionsCounter.popAll();

    const keys = Object.keys(cachedImpressions);
    for (let i = 0; i < keys.length; i++) {
      const splitted = keys[i].split('::');
      if (splitted.length !== 2) continue;
      const featureName = splitted[0];
      const timeFrame = splitted[1];

      const impressionsInTimeframe = {
        t: featureName, // Test Name
        m: timeFrame, // Time Frame
        rc: cachedImpressions[keys[i]] // Count
      };

      pf.push(impressionsInTimeframe);
    }

    return impressionsService(impressionsCountRequest(settings, {
      body: JSON.stringify({ pf })
    }))
      .then(() => {
        impressionsRetries = 0;
      })
      .catch(err => {
        if (impressionsRetries) { // For now we retry only once.
          log.warn(`Droping ${imprCount} impressions after retry. Reason ${err}.`);
          impressionsRetries = 0;
        } else {
          impressionsRetries++;
          log.warn(`Failed to push ${imprCount} impressions, keeping data to retry on next iteration. Reason ${err}.`);
        }
      })
      .then(() => latencyTrackerStop());
  };

  let stopImpressionsPublisher = false;
  let stopPerformancePublisher = false;
  let stopImpressionsCachedPublisher = false;

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

      if (shouldPushImpressionsCache) {
        stopImpressionsCachedPublisher = repeat(
          schedulePublisher => pushCachedImpressions().then(() => schedulePublisher()),
          settings.scheduler.impressionsRefreshCount
        );
      }
    },

    flush() {
      if (shouldPushImpressionsCache) pushCachedImpressions();
      return pushImpressions();
    },

    stop() {
      stopImpressionsPublisher && stopImpressionsPublisher();
      stopPerformancePublisher && stopPerformancePublisher();
      if (shouldPushImpressionsCache) stopImpressionsCachedPublisher && stopImpressionsCachedPublisher();
    },

    // Metrics collectors
    collectors: {
      segmentChanges: new SegmentChangesCollector(storage),
      splitChanges: new SplitChangesCollector(storage),
      mySegments: new MySegmentsCollector(storage),
      client: new ClientCollector(storage)
    }
  };
};

export default MetricsFactory;
