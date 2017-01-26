// @flow

'use strict';

// I'll need to fix first 'isomorphic-fetch' to be transpiled using
// babel-runtime before remove this line of code.
require('core-js/es6/promise');

const log = require('debug')('splitio-client');
const Engine = require('../engine');

const TimeTracker = require('../tracker/Timer');
const PassTracker = require('../tracker/PassThrough');

const { matching, bucketing } = require('../utils/key/factory');
const LabelsConstants = require('../utils/labels');

function ClientFactory(settings: Settings, storage: SplitStorage): SplitClient {
  const latencyTracker = TimeTracker(storage.metrics);
  const impressionsTracker = PassTracker(storage.impressions);

  return {
    async getTreatment(key: SplitKey, splitName: string, attributes: ?Object): Promise<string> {
      // @TODO review parameter
      const stopLatencyTracker = latencyTracker('getTreament');
      const splitObject = await storage.splits.getSplit(splitName);
      const bucketingKey = bucketing(key);

      let evaluation = {
        treatment: 'control',
        label: LabelsConstants.SPLIT_NOT_FOUND
      };
      let changeNumber = undefined;
      let label = undefined;

      if (splitObject) {
        const split = Engine.parse(JSON.parse(splitObject), storage);

        evaluation = await split.getTreatment(key, attributes);
        changeNumber = split.getChangeNumber();

        if (settings.core.labelsEnabled) label = evaluation.label;

        log(`Split ${splitName} key ${matching(key)} evaluation ${evaluation.treatment}`);
      } else {
        log(`Split ${splitName} doesn't exist`);
      }

      stopLatencyTracker();

      impressionsTracker({
        feature: splitName,
        key: matching(key),
        treatment: evaluation.treatment,
        time: Date.now(),
        bucketingKey,
        label,
        changeNumber
      });

      return evaluation.treatment;
    }
  };

}

module.exports = ClientFactory;
