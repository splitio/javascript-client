/* @flow */ 'use strict';

const log = require('debug')('splitio');

const coreSettings = require('@splitsoftware/splitio-utils/lib/settings');

const metrics = require('@splitsoftware/splitio-metrics');
const impressionsTracker = metrics.impressions;
const getTreatmentTracker = metrics.getTreatment;

const core = require('./core');

function splitio(settings /*: object */) /*: object */ {
  let engine;
  let engineReadyPromise;

  // setup settings for all the modules
  coreSettings.configure(settings);

  // the engine startup is async (till we get localStorage as
  // secondary cache)
  engineReadyPromise = core.start().then(function (initializedEngine) {
    engine = initializedEngine;
  }).catch(function noop() { /* only for now */});

  return {
    getTreatment(key /*: string */, featureName /*: string */) /*: string */ {
      let treatment = 'control';

      if (engine === undefined) {
        impressionsTracker.track({
          feature: featureName,
          key,
          treatment,
          when: Date.now()
        });

        return treatment;
      }

      let stop = getTreatmentTracker.track(); // start engine perf monitoring

      let split = engine.splits.get(featureName);
      if (split) {
        treatment = split.getTreatment(key);

        log(`feature ${featureName} key ${key} evaluated as ${treatment}`);
      } else {
        log(`feature ${featureName} doesn't exist`);
      }

      stop(); // finish engine perf monitoring

      impressionsTracker.track({
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
