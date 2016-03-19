'use strict';

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

var coreSettings = require('@splitsoftware/splitio-utils/lib/settings');

var metricsEngine = require('@splitsoftware/splitio-metrics');
var impressionsTracker = metricsEngine.impressions;
var getTreatmentTracker = metricsEngine.getTreatment;

var core = require('./core');

function splitio(settings /*: object */) /*: object */{
  var engine = void 0;
  var engineReadyPromise = void 0;

  // setup settings for all the modules
  settings = coreSettings.configure(settings);

  // the engine startup is async (till we get localStorage as
  // secondary cache)
  engineReadyPromise = core.start().then(function (initializedEngine) {
    engine = initializedEngine;
  }).catch(function noop() {/* only for now */});

  // startup monitoring tools
  metricsEngine.start(settings);

  return {
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
      return engineReadyPromise;
    }
  };
}

module.exports = splitio;
//# sourceMappingURL=node.js.map