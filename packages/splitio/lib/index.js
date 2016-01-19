/* @flow */'use strict';

var core = require('./core');
var log = require('debug')('splitio');

function splitter(authorizationKey /*: string */) /*: Promise */{
  return core.start(authorizationKey).then(function (storage) {
    return {
      /**
       * Evaluates is a given userId is enabled for a given feature.
       */

      isOn: function isOn(userId /*: string */, featureName /*: string */) {
        var split = storage.splits.get(featureName);

        if (split) {
          var splitEvaluation = split.isOn(userId);

          log('[splitio] feature ' + featureName + ' key ' + userId + ' evaluated as ' + splitEvaluation);

          return splitEvaluation;
        } else {
          log('[splitio] feature ' + featureName + ' is not available yet');

          return false;
        }
      }
    };
  });
}

module.exports = splitter;
//# sourceMappingURL=index.js.map