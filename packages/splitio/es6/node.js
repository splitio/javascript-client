/* @flow */ 'use strict';

let coreSettings = require('./settings');
let core = require('./core');

let tracker = require('@splitsoftware/splitio-metrics').sdk.tracker();
let log = require('debug')('splitio');

function splitio(settings /*: object */) /*: object */ {
  let engine;
  let coreReady;

  // setup settings for all the modules
  coreSettings.configure(settings);

  // the engine startup is async (till we get localStorage as
  // secondary cache)
  coreReady = core.start()
    .then(initializedEngine => engine = initializedEngine);

  coreReady.catch(function noop() { /* only for now */});

  return {
    ready(onReady) {
      coreReady.then(onReady);
    },
    getTreatment(key /*: string */, featureName /*: string */) /*: string */ {
      let treatment = 'control';

      if (engine === undefined) {
        return treatment;
      }

      let split = engine.splits.get(featureName);
      let stop = tracker();
      if (split) {
        treatment = split.getTreatment(key);

        log(`feature ${featureName} key ${key} evaluated as ${treatment}`);
      } else {
        log(`feature ${featureName} doesn't exist`);
      }
      stop();

      return treatment;
    }
  };
}

module.exports = splitio;
