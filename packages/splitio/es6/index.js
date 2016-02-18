/* @flow */ 'use strict';

let coreSettings = require('./settings');
let core = require('./core');

let tracker = require('@splitsoftware/splitio-metrics').sdk.tracker();
let log = require('debug')('splitio');

function splitio(settings /*: object */) /*: Promise */ {

  // setup settings for all the modules
  coreSettings.configure(settings);

  return core.start().then(storage => {
    return {
      getTreatment(key /*: string */, featureName /*: string */, defaultTreatment /*: string */) /*: string */ {
        let split = storage.splits.get(featureName);
        let treatment = null;

        let stop = tracker();
        if (split) {
          treatment = split.getTreatment(key, defaultTreatment);

          log(`feature ${featureName} key ${key} evaluated as ${treatment}`);
        } else {
          treatment = defaultTreatment;

          log(`feature ${featureName} doesn't exist, using default ${treatment}`);
        }
        stop();

        return treatment;
      },

      isTreatment(key /*: string */, featureName /*: string */, treatment /*: string */) /*: bool */ {
        return this.getTreatment(key, featureName) === treatment;
      }
    };
  });
}

module.exports = splitio;
