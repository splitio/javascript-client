/* @flow */ 'use strict';

let core = require('./core');
let log = require('debug')('splitio');

function splitio(...args) /*: Promise */ {
  return core.start(...args).then(storage => {
    return {
      getTreatment(key /*: string */, featureName /*: string */, defaultTreatment /*: string */) /*: string */ {
        let split = storage.splits.get(featureName);

        if (split) {
          let treatment = split.getTreatment(key, defaultTreatment);

          log(`feature ${featureName} key ${key} evaluated as ${treatment}`);

          return treatment;
        } else {
          log(`feature ${featureName} doesn't exist`);

          return defaultTreatment;
        }
      },

      isTreatment(key /*: string */, featureName /*: string */, treatment /*: string */) /*: bool */ {
        return this.getTreatment(key, featureName) === treatment;
      }
    };
  });
}

module.exports = splitio;
