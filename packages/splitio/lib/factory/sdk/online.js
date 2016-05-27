'use strict';

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _create = require('babel-runtime/core-js/object/create');

var _create2 = _interopRequireDefault(_create);

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

var settingsManager = require('@splitsoftware/splitio-utils/lib/settings');
var eventHandlers = require('@splitsoftware/splitio-utils/lib/events');
var events = require('@splitsoftware/splitio-utils/lib/events').events;

var metricsEngine = require('@splitsoftware/splitio-metrics');
var impressionsTracker = metricsEngine.impressions;
var getTreatmentTracker = metricsEngine.getTreatment;

var core = require('../../core');

function onlineFactory(settings /*: object */) /*: object */{
  var engine = void 0;
  var engineReadyPromise = void 0;
  var eventsHandlerWrapper = (0, _create2.default)(eventHandlers);

  // setup settings for all the modules
  settings = settingsManager.configure(settings);

  // the engine startup is async (till we get localStorage as
  // secondary cache)
  engineReadyPromise = core.start().then(function (initializedEngine) {
    engine = initializedEngine;
  }).catch(function () {});

  // startup monitoring tools
  metricsEngine.start(settings);

  return (0, _assign2.default)(eventsHandlerWrapper, {
    getTreatment: function getTreatment(key /*: string */, featureName /*: string */, attributes /*: object */) /*: string */{
      var treatment = 'control';

      if (engine === undefined) {
        impressionsTracker({
          feature: featureName,
          key: key,
          treatment: treatment,
          when: Date.now()
        });

        return treatment;
      }

      var stopGetTreatmentTracker = getTreatmentTracker(); // start engine perf monitoring

      var split = engine.splits.get(featureName);
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

      return engineReadyPromise.then(function () {
        return _this.emit(events.SDK_READY, engine);
      });
    }
  });
}

module.exports = onlineFactory;