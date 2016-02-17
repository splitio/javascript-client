'use strict';

let timeDS = require('./ds/time');
let timeDTO = require('./dto/time');
let trackerFactory = require('./tracker');
let fibonacciCollector = require('./collector/fibonacci');
let splitSettings = require('@splitsoftware/splitio/lib/settings');

function metricFactory(name, collectorFactory) {
  let c = collectorFactory();
  let t = trackerFactory(c);

  return {
    tracker() {
      return t;
    },

    publish() {
      return timeDS({
        authorizationKey: splitSettings.get('authorizationKey'),
        dto: timeDTO('sdk.getTreatment', c)
      });
    }
  };
}

let sdk = metricFactory('sdk.getTreatment', fibonacciCollector);

function publish() {
  sdk.publish();
}

module.exports = {
  sdk,
  publish
};
