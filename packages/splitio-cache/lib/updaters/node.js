'use strict';

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

var Updater = function () {
  function Updater(splitsUpdater, segmentsUpdater, splitsUpdaterRefreshRate, segmentsUpdaterRefreshRate) {
    (0, _classCallCheck3.default)(this, Updater);

    this.splitsUpdater = splitsUpdater;
    this.segmentsUpdater = segmentsUpdater;
    this.splitsUpdaterRefreshRate = splitsUpdaterRefreshRate;
    this.segmentsUpdaterRefreshRate = segmentsUpdaterRefreshRate;
  }

  (0, _createClass3.default)(Updater, [{
    key: 'start',
    value: function start() {
      var _this = this;

      var isSegmentsUpdaterRunning = false;

      this.stopSplitsUpdate = repeat(function (scheduleSplitsUpdate) {
        _this.splitsUpdater().then(function (splitsHasBeenUpdated) {
          if (!isSegmentsUpdaterRunning && splitsHasBeenUpdated) {
            isSegmentsUpdaterRunning = true;
            _this.stopSegmentsUpdate = repeat(function (scheduleSegmentsUpdate) {
              return _this.segmentsUpdater().then(scheduleSegmentsUpdate);
            }, _this.segmentsUpdaterRefreshRate);
          }

          scheduleSplitsUpdate();
        });
      }, this.splitsUpdaterRefreshRate);
    }
  }, {
    key: 'stop',
    value: function stop() {
      this.stopSplitsUpdate && this.stopSplitsUpdate();
      this.stopSegmentsUpdate && this.stopSegmentsUpdate();
    }
  }]);
  return Updater;
}();

module.exports = {
  SplitsUpdater: require('../updater/splitChanges'),
  SegmentsUpdater: require('../updater/segmentChanges'),
  Updater: Updater
};