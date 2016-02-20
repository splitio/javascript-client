/* @flow */ 'use strict';

let coreSettings = require('./settings');
let core = require('./core');

let tracker = require('@splitsoftware/splitio-metrics').sdk.tracker();
let log = require('debug')('splitio');

function splitio(settings /*: object */) /*: object */ {
  let engine;

  // setup settings for all the modules
  coreSettings.configure(settings);

  // the engine startup is async (till we get localStorage as
  // secondary cache)
  core.start().then(initializedEngine => engine = initializedEngine);

  return {
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

global.splitio = module.exports = splitio;
