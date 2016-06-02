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
var SchedulerFactory = require('@splitsoftware/splitio-utils/lib/scheduler');
var Storage = require('./storage');
var Updaters = require('./updaters');

var log = require('debug')('splitio-cache');
var sync = require('./sync');

var Cache = function () {
  function Cache(settings, hub) {
    (0, _classCallCheck3.default)(this, Cache);

    this.settings = settings;
    this.hub = hub;

    this.splitRefreshScheduler = SchedulerFactory();
    this.segmentsRefreshScheduler = SchedulerFactory();

    this.storage = Storage.createStorage();

    this.splitsUpdater = Updaters.SplitsUpdater(this.settings, this.hub, this.storage);
    this.segmentsUpdater = Updaters.SegmentsUpdater(this.settings, this.hub, this.storage);
  }

  (0, _createClass3.default)(Cache, [{
    key: 'start',
    value: function start() {
      log('sync started');

      return sync.call(this);
    }
  }, {
    key: 'stop',
    value: function stop() {
      log('stopped syncing');

      this.splitRefreshScheduler.kill();
      this.segmentsRefreshScheduler.kill();
    }
  }]);
  return Cache;
}();

module.exports = Cache;