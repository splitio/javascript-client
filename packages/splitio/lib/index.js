/* @flow */'use strict';

var core = require('./core');
var log = require('debug')('splitio');

function splitter() /*: Promise */{
  return core.start.apply(core, arguments).then(function (storage) {
    return {
      /**
       * Evaluates if a given 'userId' is enabled for a given featureName.
       */

      isOn: function isOn(userId /*: string */, featureName /*: string */) /*: boolean */{
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