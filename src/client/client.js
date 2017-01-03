// @flow

'use strict';

// I'll need to fix first 'isomorphic-fetch' to be transpiled using
// babel-runtime before remove this line of code.
require('core-js/es6/promise');

const log = require('debug')('splitio-client');
const Engine = require('../engine');

const TimeTracker = require('../tracker/Timer');
const PassTracker = require('../tracker/PassThrough');

function SplitClientFactory(storage: SplitStorage): SplitClient {
  const latencyTracker = TimeTracker(storage.metrics);
  const impressionsTracker = PassTracker(storage.impressions);

  return {
    async getTreatment(key: string, splitName: string, attributes: ?Object): Promise<string> {
      const stopLatencyTracker = latencyTracker();

      const splitObject = await storage.splits.getSplit(splitName);
      let treatment = 'control';

      if (splitObject) {
        const split = Engine.parse(JSON.parse(splitObject), storage);

        treatment = await split.getTreatment(key, attributes);

        log(`Split ${splitName} key ${key} evaluation ${treatment}`);
      } else {
        log(`Split ${splitName} doesn't exist`);
      }

      stopLatencyTracker();

      impressionsTracker({
        feature: splitName,
        key,
        treatment,
        when: Date.now()
      });

      return treatment;
    }
  };

}

module.exports = SplitClientFactory;
