'use strict';

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

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

var log = require('debug')('splitio');

var SettingsFactory = require('@splitsoftware/splitio-utils/lib/settings');
var EventsFactory = require('@splitsoftware/splitio-utils/lib/events');
var Event = EventsFactory.Event;
var Metrics = require('@splitsoftware/splitio-metrics');
var Cache = require('@splitsoftware/splitio-cache');

function onlineFactory(params /*: object */) /*: object */{
  var settings = SettingsFactory(params);
  var hub = EventsFactory();
  var metrics = new Metrics(settings);
  var impressionsTracker = metrics.impressions;
  var getTreatmentTracker = metrics.getTreatment;
  var cache = new Cache(settings, hub);

  var storage = void 0;
  var storageReadyPromise = void 0;

  storageReadyPromise = cache.start().then(function (_storage) {
    storage = _storage;
  }).catch(function () {
    storage = undefined;
  });

  metrics.start(settings);

  return (0, _assign2.default)(hub, {
    getTreatment: function getTreatment(key /*: string */, featureName /*: string */, attributes /*: object */) /*: string */{
      var treatment = 'control';

      if (storage === undefined) {
        impressionsTracker({
          feature: featureName,
          key: key,
          treatment: treatment,
          when: Date.now()
        });

        return treatment;
      }

      var stopGetTreatmentTracker = getTreatmentTracker(); // start engine perf monitoring

      var split = storage.splits.get(featureName);
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
    ready: function ready() /*: Promise */{
      var _this = this;

      return storageReadyPromise.then(function () {
        return _this.emit(Event.SDK_READY, storage);
      });
    },
    destroy: function destroy() {
      hub.removeAllListeners();
      metrics.stop();
      cache.stop();
    }
  });
}

module.exports = onlineFactory;