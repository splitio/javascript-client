/* @flow */ 'use strict';

let core = require('./core');
let log = require('debug')('splitio');

function splitter(authorizationKey /*: string */) /*: Promise */ {
  return core.start(authorizationKey).then(storage => {
    return {
      /**
       * Evaluates is a given userId is enabled for a given feature.
       */
      isOn(userId /*: string */, featureName /*: string */) {
        let split = storage.splits.get(featureName);

        if (split) {
          let splitEvaluation = split.isOn(userId);

          log(`[splitio] feature ${featureName} key ${userId} evaluated as ${splitEvaluation}`);

          return splitEvaluation;
        } else {
          log(`[splitio] feature ${featureName} is not available yet`);

          return false;
        }
      }
    };
  });
}

module.exports = splitter;
