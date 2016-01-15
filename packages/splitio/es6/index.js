'use strict';

var core = require('./core');

function splitter(authorizationKey /*: string */) {
  return core.start(authorizationKey).then(storage => {
    return {
      /**
       * Evaluates is a given userId is enabled for a given feature.
       */
      isOn(userId /*: string */, featureName /*: string */) {
        return storage.getSplit(featureName).evaluate(userId);
      }
    };
  });
}

module.exports = splitter;
