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
var Storage = require('./storage');

var _require = require('./updaters');

var SplitsUpdater = _require.SplitsUpdater;
var SegmentsUpdater = _require.SegmentsUpdater;
var Updater = _require.Updater;

var Cache = function () {
  function Cache(settings, hub) {
    (0, _classCallCheck3.default)(this, Cache);

    this.storage = Storage.createStorage();

    this.updater = new Updater(SplitsUpdater(settings, hub, this.storage), SegmentsUpdater(settings, hub, this.storage), settings.scheduler.featuresRefreshRate, settings.scheduler.segmentsRefreshRate);
  }

  (0, _createClass3.default)(Cache, [{
    key: 'start',
    value: function start() {
      this.updater.start();
    }
  }, {
    key: 'stop',
    value: function stop() {
      this.updater.stop();
    }
  }]);
  return Cache;
}();

module.exports = Cache;