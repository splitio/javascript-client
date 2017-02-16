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

function getTreatmentAvailable(
  evaluation: Evaluation,
  changeNumber: ?number,
  settings: Settings,
  splitName: string,
  key: SplitKey,
  stopLatencyTracker: Function,
  impressionsTracker: Function
) {
  const bucketingKey = bucketing(key);
  const matchingKey = matching(key);
  const { treatment } = evaluation;

  let label = undefined;

  if (changeNumber > 0) {
    if (settings.core.labelsEnabled) label = evaluation.label;

    log(`Split ${splitName} key ${matchingKey} evaluation ${treatment}`);
  } else {
    log(`Split ${splitName} doesn't exist`);
  }

  stopLatencyTracker();

  impressionsTracker({
    feature: splitName,
    key: matchingKey,
    treatment,
    time: Date.now(),
    bucketingKey,
    label,
    changeNumber
  });

  return evaluation.treatment;
}

function splitObjectAvailable(
  splitObject: ?string,
  splitName: string,
  key: SplitKey,
  attributes: ?Object,
  stopLatencyTracker: Function,
  impressionsTracker: Function,
  settings: Settings,
  storage: SplitStorage
) {
  let evaluation = {
    treatment: 'control',
    label: LabelsConstants.SPLIT_NOT_FOUND
  };
  let changeNumber = undefined;

  if (splitObject) {
    const split = Engine.parse(JSON.parse(splitObject), storage);

    evaluation = split.getTreatment(key, attributes);
    changeNumber = split.getChangeNumber();

    // If the storage is async, evaluation and changeNumber will return a
    // thenable
    if (evaluation.then || changeNumber.then)
      return Promise.all([evaluation, changeNumber]).then(([result, changeNumber]) => getTreatmentAvailable(
        result,
        changeNumber,
        settings,
        splitName,
        key,
        stopLatencyTracker,
        impressionsTracker
      ));
  }

  return getTreatmentAvailable(
    evaluation,
    changeNumber,
    settings,
    splitName,
    key,
    stopLatencyTracker,
    impressionsTracker
  );
}

function ClientFactory(settings: Settings, storage: SplitStorage): SplitClient {
  const latencyTracker = TimeTracker(storage.metrics);
  const impressionsTracker = PassTracker(storage.impressions);

  return {
    getTreatment(key: SplitKey, splitName: string, attributes: ?Object): AsyncValue<string> {
      const stopLatencyTracker: Function = latencyTracker('getTreament');
      const splitObject: AsyncValue<?string> = storage.splits.getSplit(splitName);

      if (splitObject != undefined && splitObject.then) {
        return splitObject.then((result: ?string) => splitObjectAvailable(
          result,
          splitName,
          key,
          attributes,
          stopLatencyTracker,
          impressionsTracker,
          settings,
          storage
        ));
      }

      return splitObjectAvailable(
        splitObject,
        splitName,
        key,
        attributes,
        stopLatencyTracker,
        impressionsTracker,
        settings,
        storage
      );
    }
  };

}

module.exports = ClientFactory;
