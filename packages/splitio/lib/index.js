/* @flow */'use strict';

var core = require('./core');
var log = require('debug')('splitio');

function splitio() /*: Promise */{
  return core.start.apply(core, arguments).then(function (storage) {
    return {
      getTreatment: function getTreatment(key /*: string */, featureName /*: string */, defaultTreatment /*: string */) /*: string */{
        var split = storage.splits.get(featureName);

        if (split) {
          var treatment = split.getTreatment(key, defaultTreatment);

          log('feature ' + featureName + ' key ' + key + ' evaluated as ' + treatment);

          return treatment;
        } else {
          log('feature ' + featureName + ' doesn\'t exist');

          return defaultTreatment;
        }
      },
      isTreatment: function isTreatment(key /*: string */, featureName /*: string */, treatment /*: string */) /*: bool */{
        return this.getTreatment(key, featureName) === treatment;
      }
    };
  });
}

module.exports = splitio;
//# sourceMappingURL=index.js.map