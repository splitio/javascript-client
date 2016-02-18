/* @flow */'use strict';

var coreSettings = require('./settings');
var core = require('./core');

var tracker = require('@splitsoftware/splitio-metrics').sdk.tracker();
var log = require('debug')('splitio');

function splitio(settings /*: object */) /*: Promise */{

  // setup settings for all the modules
  coreSettings.configure(settings);

  return core.start().then(function (storage) {
    return {
      getTreatment: function getTreatment(key /*: string */, featureName /*: string */, defaultTreatment /*: string */) /*: string */{
        var split = storage.splits.get(featureName);
        var treatment = null;

        var stop = tracker();
        if (split) {
          treatment = split.getTreatment(key, defaultTreatment);

          log('feature ' + featureName + ' key ' + key + ' evaluated as ' + treatment);
        } else {
          treatment = defaultTreatment;

          log('feature ' + featureName + ' doesn\'t exist, using default ' + treatment);
        }
        stop();

        return treatment;
      },
      isTreatment: function isTreatment(key /*: string */, featureName /*: string */, treatment /*: string */) /*: bool */{
        return this.getTreatment(key, featureName) === treatment;
      }
    };
  });
}

module.exports = splitio;
//# sourceMappingURL=index.js.map