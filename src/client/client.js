// @flow

'use strict';

// I'll need to fix first 'isomorphic-fetch' to be transpiled using
// babel-runtime before remove this line of code.
require('core-js/es6/promise');

const log = require('debug')('splitio-client');
const Engine = require('../engine');

const TimeTracker = require('../tracker/Timer');
const PassTracker = require('../tracker/PassThrough');

const thenable = require('../utils/promise/thenable');
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
  const matchingKey = matching(key);
  const bucketingKey = bucketing(key);

  const { treatment } = evaluation;
  let label = undefined;

  if (evaluation.treatment !== 'control') {
    log(`Split ${splitName} key ${matchingKey} evaluation ${treatment}`);
  } else {
    log(`Split ${splitName} doesn't exist`);
  }

  if (settings.core.labelsEnabled) label = evaluation.label;

  stopLatencyTracker();

  impressionsTracker({
    feature: splitName,
    keyName: matchingKey,
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
    changeNumber = split.getChangeNumber(); // Always sync and optional

    // If the storage is async, evaluation and changeNumber will return a
    // thenable
    if (thenable(evaluation)) {
      return evaluation.then(result => getTreatmentAvailable(
        result,
        changeNumber,
        settings,
        splitName,
        key,
        stopLatencyTracker,
        impressionsTracker
      ));
    }
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

      if (thenable(splitObject)) {
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
    },
    getTreatments(key: SplitKey, splitNames: Array<string>, attributes: ?Object): AsyncValue<Object> {
      let results = {};
      let thenables = [];
      let i;

      for (i = 0; i < splitNames.length; i ++) {
        const name = splitNames[i];
        // If we are on the browser, key was binded to the getTreatment method.
        const treatment = this.isBrowserClient ? this.getTreatment(name, attributes) : this.getTreatment(key, name, attributes);

        if (thenable(treatment)) {
          // If treatment returns a promise as it is being evaluated, save promise for progress tracking.
          thenables.push(treatment);
          treatment.then((res) => {
            // set the treatment on the cb;
            results[name] = res;
          });
        } else {
          results[name] = treatment;
        }
      }

      if (thenables.length) {
        return Promise.all(thenables).then(() => {
          // After all treatments are resolved, we return the mapping object.
          return results;
        });
      } else {
        return results;
      }
    }
  };

}

module.exports = ClientFactory;
