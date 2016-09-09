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
const repeat = require('../utils/fn/repeat');

const metricsService = require('../services/metrics');
const metricsServiceRequest = require('../services/metrics/post');
const metricsDTO = require('../services/metrics/dto');

const impressionsService = require('../services/impressions');
const impressionsBulkRequest = require('../services/impressions/bulk');
const impressionsDTO = require('../services/impressions/dto');

const PassThroughFactory = require('./tracker/PassThrough');
const TimerFactory = require('./tracker/Timer');

const SequentialCollector = require('./collector/sequential');
const FibonacciCollector = require('./collector/fibonacci');

class Metrics {
  constructor(settings) {
    this.settings = settings;

    this.impressionsCollector = SequentialCollector();
    this.getTreatmentCollector = FibonacciCollector();

    this.impressions = PassThroughFactory(this.impressionsCollector);
    this.getTreatment = TimerFactory(this.getTreatmentCollector);
  }

  publishToTime() {
    return new Promise(resolve => {
      if (this.getTreatmentCollector.isEmpty()) {
        return resolve();
      }

      resolve(metricsService(metricsServiceRequest(this.settings, {
        body: JSON.stringify(
          metricsDTO.fromGetTreatmentCollector(this.getTreatmentCollector)
        )
      }))
      .then(resp => {
        this.getTreatmentCollector.clear();

        return resp;
      })
      .catch(() => {
        this.getTreatmentCollector.clear();
      }));
    });
  }

  publishToImpressions() {
    return new Promise(resolve => {
      if (this.impressionsCollector.isEmpty()) {
        return resolve();
      }

      resolve(impressionsService(impressionsBulkRequest(this.settings, {
        body: JSON.stringify(
          impressionsDTO.fromImpressionsCollector(this.impressionsCollector)
        )
      }))
      .then(resp => {
        this.impressionsCollector.clear();

        return resp;
      })
      .catch(() => {
        this.impressionsCollector.clear();
      }));
    });
  }

  start() {
    this.stopImpressionsPublisher = repeat(schedulePublisher => {
      this.publishToImpressions().then(() => {
        schedulePublisher();
      });
    }, this.settings.scheduler.impressionsRefreshRate);

    this.stopPerformancePublisher = repeat(schedulePublisher => {
      this.publishToTime().then(() => {
        schedulePublisher();
      });
    }, this.settings.scheduler.metricsRefreshRate);
  }

  stop() {
    this.stopImpressionsPublisher && this.stopImpressionsPublisher();
    this.stopPerformancePublisher && this.stopPerformancePublisher();
  }
}

module.exports = Metrics;
