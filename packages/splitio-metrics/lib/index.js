'use strict';

var TimeDS = require('./ds/Time');
var TimeDTO = require('./dto/Time');
var TimerFactory = require('./tracker/Timer');
var FibonacciCollector = require('./collector/Fibonacci');

// @TODO fixes comming soon
var splitSettings = require('@splitsoftware/splitio/lib/settings');

function metricFactory(name, CollectorFactory, TrackerFactory) {
  var c = CollectorFactory();
  var t = TrackerFactory(c);

  return {
    tracker: function tracker() {
      return t;
    },
    publish: function publish() {
      return !c.isEmpty() && timeDS({
        authorizationKey: splitSettings.get('authorizationKey'),
        dto: timeDTO('sdk.getTreatment', c)
      }).then(function (resp) {
        c.clear();return resp;
      }).catch(function (error) {
        c.clear();
      });
    }
  };
}

var sdk = metricFactory('sdk.getTreatment', FibonacciCollector, TimerFactory);

function publish() {
  sdk.publish();
}

module.exports = {
  sdk: sdk,
  publish: publish
};
//# sourceMappingURL=index.js.map