'use strict';

var timeDS = require('./ds/time');
var timeDTO = require('./dto/time');
var trackerFactory = require('./tracker');
var fibonacciCollector = require('./collector/fibonacci');
var splitSettings = require('@splitsoftware/splitio/lib/settings');

function metricFactory(name, collectorFactory) {
  var c = collectorFactory();
  var t = trackerFactory(c);

  return {
    tracker: function tracker() {
      return t;
    },
    publish: function publish() {
      return timeDS({
        authorizationKey: splitSettings.get('authorizationKey'),
        dto: timeDTO('sdk.getTreatment', c)
      });
    }
  };
}

var sdk = metricFactory('sdk.getTreatment', fibonacciCollector);

function publish() {
  sdk.publish();
}

module.exports = {
  sdk: sdk,
  publish: publish
};
//# sourceMappingURL=index.js.map