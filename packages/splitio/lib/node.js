/* @flow */'use strict';

var log = require('debug')('splitio');

var coreSettings = require('@splitsoftware/splitio-utils/lib/settings');

var metrics = require('@splitsoftware/splitio-metrics');
var impressionsTracker = metrics.impressions;
var getTreatmentTracker = metrics.getTreatment;

var core = require('./core');

function splitio(settings /*: object */) /*: object */{
  var engine = undefined;
  var engineReadyPromise = undefined;

  // setup settings for all the modules
  coreSettings.configure(settings);

  // the engine startup is async (till we get localStorage as
  // secondary cache)
  engineReadyPromise = core.start().then(function (initializedEngine) {
    engine = initializedEngine;
  }).catch(function noop() {/* only for now */});

  return {
    getTreatment: function getTreatment(key /*: string */, featureName /*: string */) /*: string */{
      var treatment = 'control';

      if (engine === undefined) {
        impressionsTracker.track({
          feature: featureName,
          key: key,
          treatment: treatment,
          when: Date.now()
        });

        return treatment;
      }

      var stop = getTreatmentTracker.track(); // start engine perf monitoring

      var split = engine.splits.get(featureName);
      if (split) {
        treatment = split.getTreatment(key);

        log('feature ' + featureName + ' key ' + key + ' evaluated as ' + treatment);
      } else {
        log('feature ' + featureName + ' doesn\'t exist');
      }

      stop(); // finish engine perf monitoring

      impressionsTracker.track({
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