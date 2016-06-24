'use strict';

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

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

// I'll need to fix first 'isomorphic-fetch' to be transpiled using
// babel-runtime before remove this line of code.
require('core-js/es6/promise');

var warning = require('warning');
var log = require('debug')('splitio');

var SettingsFactory = require('@splitsoftware/splitio-utils/lib/settings');
var EventsFactory = require('@splitsoftware/splitio-utils/lib/events');
var Metrics = require('@splitsoftware/splitio-metrics');
var Cache = require('@splitsoftware/splitio-cache');

function onlineFactory(params /*: object */) /*: object */{
  var settings = SettingsFactory(params);
  var hub = EventsFactory();
  var metrics = new Metrics(settings);
  var impressionsTracker = metrics.impressions;
  var getTreatmentTracker = metrics.getTreatment;
  var cache = new Cache(settings, hub);

  log(settings);

  cache.start();
  metrics.start();

  // start the race vs the SDK startup!
  if (settings.startup.readyTimeout > 0) {
    setTimeout(function () {
      hub.emit(hub.Event.SDK_READY_TIMED_OUT);
    }, settings.startup.readyTimeout);
  }

  var readyPromise = new _promise2.default(function onReady(resolve) {
    hub.on(hub.Event.SDK_READY, resolve);
  });

  return (0, _assign2.default)(hub, {
    getTreatment: function getTreatment(key /*: string */, featureName /*: string */, attributes /*: object */) /*: string */{
      var treatment = 'control';

      var stopGetTreatmentTracker = getTreatmentTracker(); // start engine perf monitoring

      var split = cache.storage.splits.get(featureName);
      if (split) {
        treatment = split.getTreatment(key, attributes);

        log('feature ' + featureName + ' key ' + key + ' evaluated as ' + treatment);
      } else {
        log('feature ' + featureName + ' doesn\'t exist');
      }

      stopGetTreatmentTracker(); // finish engine perf monitoring

      impressionsTracker({
        feature: featureName,
        key: key,
        treatment: treatment,
        when: Date.now()
      });

      return treatment;
    },
    ready: function ready() {
      warning(false, '`.ready()` is deprecated. Please use `sdk.on(sdk.Event.SDK_READY, callback)`');
      return readyPromise;
    },
    destroy: function destroy() {
      log('destroying sdk instance');

      hub.removeAllListeners();
      metrics.stop();
      cache.stop();
    }
  });
}

module.exports = onlineFactory;