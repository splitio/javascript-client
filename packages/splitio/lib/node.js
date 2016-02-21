/* @flow */'use strict';

var coreSettings = require('./settings');
var core = require('./core');

var tracker = require('@splitsoftware/splitio-metrics').sdk.tracker();
var log = require('debug')('splitio');

function splitio(settings /*: object */) /*: object */{
  var engine = undefined;
  var engineReadyPromise = undefined;

  // setup settings for all the modules
  coreSettings.configure(settings);

  // the engine startup is async (till we get localStorage as
  // secondary cache)
  engineReadyPromise = core.start().then(function (initializedEngine) {
    engine = initializedEngine;
  }).catch(function noop() {/* only for now */});

  return {
    getTreatment: function getTreatment(key /*: string */, featureName /*: string */) /*: string */{
      var treatment = 'control';

      if (engine === undefined) {
        return treatment;
      }

      var split = engine.splits.get(featureName);
      var stop = tracker();
      if (split) {
        treatment = split.getTreatment(key);

        log('feature ' + featureName + ' key ' + key + ' evaluated as ' + treatment);
      } else {
        log('feature ' + featureName + ' doesn\'t exist');
      }
      stop();

      return treatment;
    },
    ready: function ready() /*: Promise */{
      return engineReadyPromise;
    }
  };
}

module.exports = splitio;
//# sourceMappingURL=node.js.map