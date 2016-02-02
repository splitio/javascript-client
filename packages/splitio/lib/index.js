/* @flow */'use strict';

var core = require('./core');
var log = require('debug')('splitio');

function splitter() /*: Promise */{
  return core.start.apply(core, arguments).then(function (storage) {
    return {
      /**
       * Evaluates if a given 'key' is enabled for a given featureName.
       */

      isOn: function isOn(key /*: string */, featureName /*: string */) /*: boolean */{
        var split = storage.splits.get(featureName);

        if (split) {
          var splitEvaluation = split.isOn(key);

          log('feature ' + featureName + ' key ' + key + ' evaluated as ' + splitEvaluation);

          return splitEvaluation;
        } else {
          log('feature ' + featureName + ' doesn\'t exists');

          return false;
        }
      }
    };
  });
}

module.exports = splitter;
//# sourceMappingURL=index.js.map