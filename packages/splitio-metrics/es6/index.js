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
const SchedulerFactory = require('@splitsoftware/splitio-utils/lib/scheduler');

const metricsService = require('@splitsoftware/splitio-services/lib/metrics');
const metricsServiceRequest = require('@splitsoftware/splitio-services/lib/metrics/post');
const metricsDTO = require('@splitsoftware/splitio-services/lib/metrics/dto');

const impressionsService = require('@splitsoftware/splitio-services/lib/impressions');
const impressionsBulkRequest = require('@splitsoftware/splitio-services/lib/impressions/bulk');
const impressionsDTO = require('@splitsoftware/splitio-services/lib/impressions/dto');

const PassThroughFactory = require('./tracker/PassThrough');
const TimerFactory = require('./tracker/Timer');

const SequentialCollector = require('./collector/sequential');
const FibonacciCollector = require('./collector/fibonacci');

class Metrics {
  constructor() {
    this.impressionsCollector = SequentialCollector();
    this.getTreatmentCollector = FibonacciCollector();

    this.performanceScheduler = SchedulerFactory();
    this.impressionsScheduler = SchedulerFactory();

    this.impressions = PassThroughFactory(this.impressionsCollector);
    this.getTreatment = TimerFactory(getTreatmentCollector);
  }

  publishToTime(settings) {
    if (!this.getTreatmentCollector.isEmpty()) {
      metricsService(metricsServiceRequest(settings, {
        body: JSON.stringify(metricsDTO.fromGetTreatmentCollector(getTreatmentCollector))
      })).then(resp => {
        this.getTreatmentCollector.clear();
        return resp;
      }).catch(() => {
        this.getTreatmentCollector.clear();
      });
    }
  }

  publishToImpressions(settings) {
    if (!this.impressionsCollector.isEmpty()) {
      impressionsService(impressionsBulkRequest(settings, {
        body: JSON.stringify(impressionsDTO.fromImpressionsCollector(impressionsCollector))
      })).then(resp => {
        this.impressionsCollector.clear();
        return resp;
      }).catch(() => {
        this.impressionsCollector.clear();
      });
    }
  }

  start(settings) {
    this.performanceScheduler.forever(this.publishToTime.bind(this, settings),
      settings.get('metricsRefreshRate'));
    this.impressionsScheduler.forever(this.publishToImpressions.bind(this, settings),
      settings.get('impressionsRefreshRate'));
  }

  stop() {
    this.performanceScheduler.kill();
    this.impressionsScheduler.kill();
  }
}

module.exports = function MetricsFactory() {
  return new Metrics;
};
