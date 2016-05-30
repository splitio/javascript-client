'use strict';

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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
var SchedulerFactory = require('@splitsoftware/splitio-utils/lib/scheduler');

var metricsService = require('@splitsoftware/splitio-services/lib/metrics');
var metricsServiceRequest = require('@splitsoftware/splitio-services/lib/metrics/post');
var metricsDTO = require('@splitsoftware/splitio-services/lib/metrics/dto');

var impressionsService = require('@splitsoftware/splitio-services/lib/impressions');
var impressionsBulkRequest = require('@splitsoftware/splitio-services/lib/impressions/bulk');
var impressionsDTO = require('@splitsoftware/splitio-services/lib/impressions/dto');

var PassThroughFactory = require('./tracker/PassThrough');
var TimerFactory = require('./tracker/Timer');

var SequentialCollector = require('./collector/sequential');
var FibonacciCollector = require('./collector/fibonacci');

var impressionsCollector = SequentialCollector();
var getTreatmentCollector = FibonacciCollector();

var performanceScheduler = SchedulerFactory();
var impressionsScheduler = SchedulerFactory();

function publishToTime() {
  if (!getTreatmentCollector.isEmpty()) {
    metricsService(metricsServiceRequest({
      body: (0, _stringify2.default)(metricsDTO.fromGetTreatmentCollector(getTreatmentCollector))
    })).then(function (resp) {
      getTreatmentCollector.clear(); // once saved, cleanup the collector
      return resp;
    }).catch(function () {
      getTreatmentCollector.clear(); // after try to save, cleanup the collector
    });
  }
}

function publishToImpressions() {
  if (!impressionsCollector.isEmpty()) {
    impressionsService(impressionsBulkRequest({
      body: (0, _stringify2.default)(impressionsDTO.fromImpressionsCollector(impressionsCollector))
    })).then(function (resp) {
      impressionsCollector.clear();
      return resp;
    }).catch(function () {
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