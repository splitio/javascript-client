'use strict';

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

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
var repeat = require('@splitsoftware/splitio-utils/lib/fn/repeat');

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

var Metrics = function () {
  function Metrics(settings) {
    (0, _classCallCheck3.default)(this, Metrics);

    this.settings = settings;

    this.impressionsCollector = SequentialCollector();
    this.getTreatmentCollector = FibonacciCollector();

    this.impressions = PassThroughFactory(this.impressionsCollector);
    this.getTreatment = TimerFactory(this.getTreatmentCollector);
  }

  (0, _createClass3.default)(Metrics, [{
    key: 'publishToTime',
    value: function publishToTime() {
      var _this = this;

      return new _promise2.default(function (resolve) {
        if (_this.getTreatmentCollector.isEmpty()) {
          return resolve();
        }

        resolve(metricsService(metricsServiceRequest(_this.settings, {
          body: (0, _stringify2.default)(metricsDTO.fromGetTreatmentCollector(_this.getTreatmentCollector))
        })).then(function (resp) {
          _this.getTreatmentCollector.clear();

          return resp;
        }).catch(function () {
          _this.getTreatmentCollector.clear();
        }));
      });
    }
  }, {
    key: 'publishToImpressions',
    value: function publishToImpressions() {
      var _this2 = this;

      return new _promise2.default(function (resolve) {
        if (_this2.impressionsCollector.isEmpty()) {
          return resolve();
        }

        resolve(impressionsService(impressionsBulkRequest(_this2.settings, {
          body: (0, _stringify2.default)(impressionsDTO.fromImpressionsCollector(_this2.impressionsCollector))
        })).then(function (resp) {
          _this2.impressionsCollector.clear();

          return resp;
        }).catch(function () {
          _this2.impressionsCollector.clear();
        }));
      });
    }
  }, {
    key: 'start',
    value: function start() {
      var _this3 = this;

      this.stopImpressionsPublisher = repeat(function (schedulePublisher) {
        _this3.publishToImpressions().then(function () {
          schedulePublisher();
        });
      }, this.settings.scheduler.impressionsRefreshRate);

      this.stopPerformancePublisher = repeat(function (schedulePublisher) {
        _this3.publishToTime().then(function () {
          schedulePublisher();
        });
      }, this.settings.scheduler.metricsRefreshRate);
    }
  }, {
    key: 'stop',
    value: function stop() {
      this.stopImpressionsPublisher && this.stopImpressionsPublisher();
      this.stopPerformancePublisher && this.stopPerformancePublisher();
    }
  }]);
  return Metrics;
}();

module.exports = Metrics;