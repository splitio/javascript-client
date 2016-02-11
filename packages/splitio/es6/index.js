/* @flow */ 'use strict';

let core = require('./core');
let log = require('debug')('splitio');

function splitio(...args) /*: Promise */ {
  return core.start(...args).then(storage => {

    return {
      // Evaluates if a given 'key' is enabled for a given featureName
      isOn(key /*: string */, featureName /*: string */) /*: boolean */ {
        let split = storage.splits.get(featureName);

        if (split) {
          let splitEvaluation = split.isOn(key);

          log(`feature ${featureName} key ${key} evaluated as ${splitEvaluation}`);

          return splitEvaluation;
        } else {
          log(`feature ${featureName} doesn't exist`);

          return false;
        }
      }
    };

  });
}

module.exports = splitio;
