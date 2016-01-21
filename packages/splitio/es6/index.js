/* @flow */ 'use strict';

let core = require('./core');
let log = require('debug')('splitio');

function splitter(...args) /*: Promise */ {
  return core.start(...args).then(storage => {
    return {
      /**
       * Evaluates if a given 'userId' is enabled for a given featureName.
       */
      isOn(userId /*: string */, featureName /*: string */) /*: boolean */ {
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
