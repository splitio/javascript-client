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

const impressionsCollector = SequentialCollector();
const getTreatmentCollector = FibonacciCollector();

const performanceScheduler = SchedulerFactory();
const impressionsScheduler = SchedulerFactory();

function publishToTime() {
  if (!getTreatmentCollector.isEmpty()) {
    metricsService(metricsServiceRequest({
      body: JSON.stringify(metricsDTO.fromGetTreatmentCollector(getTreatmentCollector))
    })).then(resp => {
      getTreatmentCollector.clear(); // once saved, cleanup the collector
      return resp;
    }).catch(() => {
      getTreatmentCollector.clear(); // after try to save, cleanup the collector
    });
  }
}

function publishToImpressions() {
  if (!impressionsCollector.isEmpty()) {
    impressionsService(impressionsBulkRequest({
      body: JSON.stringify(impressionsDTO.fromImpressionsCollector(impressionsCollector))
    })).then(resp => {
      impressionsCollector.clear();
      return resp;
    }).catch(() => {
      impressionsCollector.clear();
    });
  }
}

// return {
//   start(settings) {
//     performanceScheduler.forever(publishToTime, settings.get('metricsRefreshRate'));
//     impressionsScheduler.forever(publishToImpressions, settings.get('impressionsRefreshRate'));
//   },
//
//   stop() {
//     performanceScheduler.kill();
//     impressionsScheduler.kill();
//   },
//
//   impressions: PassThroughFactory(impressionsCollector),
//   getTreatment: TimerFactory(getTreatmentCollector)
// };

module.exports = function MetricsFactory() {
// TODO
};
