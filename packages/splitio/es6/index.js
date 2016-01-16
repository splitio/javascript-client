'use strict';

var core = require('./core');
var log = require('debug')('splitio');

function splitter(authorizationKey /*: string */) {
  return core.start(authorizationKey).then(storage => {
    return {
      /**
       * Evaluates is a given userId is enabled for a given feature.
       */
      isOn(userId /*: string */, featureName /*: string */) {
        let split = storage.getSplit(featureName);

        if (split) {
          let splitEvaluation = split.isOn(userId);

          log(`[splitio] feature ${featureName} key ${userId} evaluated as ${splitEvaluation}`);

          return splitEvaluation;
        } else {
          console.log('Feature is not present yet');
          return false;
        }
      }
    };
  });
}

module.exports = splitter;
