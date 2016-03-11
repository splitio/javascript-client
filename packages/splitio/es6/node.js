// I'll need to fix first 'isomorphic-fetch' to be transpiled using
// babel-runtime before remove this line of code.
require('core-js/es6/promise');

const log = require('debug')('splitio');

const coreSettings = require('@splitsoftware/splitio-utils/lib/settings');

const metricsEngine = require('@splitsoftware/splitio-metrics');
const impressionsTracker = metricsEngine.impressions;
const getTreatmentTracker = metricsEngine.getTreatment;

const core = require('./core');

function splitio(settings /*: object */) /*: object */ {
  let engine;
  let engineReadyPromise;

  // setup settings for all the modules
  settings = coreSettings.configure(settings);

  // the engine startup is async (till we get localStorage as
  // secondary cache)
  engineReadyPromise = core.start().then(function (initializedEngine) {
    engine = initializedEngine;
  }).catch(function noop() { /* only for now */});

  // startup monitoring tools
  metricsEngine.start(settings);

  return {
    getTreatment(key /*: string */, featureName /*: string */) /*: string */ {
      let treatment = 'control';

      if (engine === undefined) {
        impressionsTracker({
          feature: featureName,
          key,
          treatment,
          when: Date.now()
        });

        return treatment;
      }

      let stopGetTreatmentTracker = getTreatmentTracker(); // start engine perf monitoring

      let split = engine.splits.get(featureName);
      if (split) {
        treatment = split.getTreatment(key);

        log(`feature ${featureName} key ${key} evaluated as ${treatment}`);
      } else {
        log(`feature ${featureName} doesn't exist`);
      }

      stopGetTreatmentTracker(); // finish engine perf monitoring

      impressionsTracker({
        feature: featureName,
        key,
        treatment,
        when: Date.now()
      });

      return treatment;
    },

    ready() /*: Promise */ {
      return engineReadyPromise;
    }
  };
}

module.exports = splitio;
