/* @flow */'use strict';

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
    getTreatment: function getTreatment(key /*: string */, featureName /*: string */) /*: string */{
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
        treatment = split.getTreatment(key);

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