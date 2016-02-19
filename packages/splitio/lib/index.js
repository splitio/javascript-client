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
      getTreatment: function getTreatment(key /*: string */, featureName /*: string */) /*: string */{
        var split = storage.splits.get(featureName);
        var treatment = 'control';

        var stop = tracker();
        if (split) {
          treatment = split.getTreatment(key);

          log('feature ' + featureName + ' key ' + key + ' evaluated as ' + treatment);
        } else {
          log('feature ' + featureName + ' doesn\'t exist');
        }
        stop();

        return treatment;
      }
    };
  });
}

module.exports = splitio;
//# sourceMappingURL=index.js.map