'use strict';

let TimeDS = require('./ds/Time');
let TimeDTO = require('./dto/Time');
let TimerFactory = require('./tracker/Timer');
let FibonacciCollector = require('./collector/Fibonacci');

// @TODO fixes comming soon
let splitSettings = require('@splitsoftware/splitio/lib/settings');

function metricFactory(name, CollectorFactory, TrackerFactory) {
  let c = CollectorFactory();
  let t = TrackerFactory(c);

  return {
    tracker() {
      return t;
    },

    publish() {
      return !c.isEmpty() && timeDS({
        authorizationKey: splitSettings.get('authorizationKey'),
        dto: timeDTO('sdk.getTreatment', c)
      })
      .then(function(resp) { c.clear(); return resp; })
      .catch(function(error) { c.clear(); });
    }
  };
}

let sdk = metricFactory('sdk.getTreatment', FibonacciCollector, TimerFactory);

function publish() {
  sdk.publish();
}

module.exports = {
  sdk,
  publish
};
