// @flow
'use strict';

// I'll need to fix first 'isomorphic-fetch' to be transpiled using
// babel-runtime before remove this line of code.
require('core-js/es6/promise');

const isFinite = require('lodash/isFinite');
const log = require('../utils/logger')('splitio-client');
const evaluator = require('../engine/evaluator');

const PassTracker = require('../tracker/PassThrough');
const tracker = require('../utils/timeTracker');

const keyParser = require('../utils/key/parser');

const thenable = require('../utils/promise/thenable');
const { matching, bucketing } = require('../utils/key/factory');

function getTreatmentAvailable(
  evaluation: Evaluation,
  splitName: string,
  key: SplitKey,
  stopLatencyTracker,
  impressionsTracker: Function
) {
  const matchingKey = matching(key);
  const bucketingKey = bucketing(key);

  const { treatment, label , changeNumber } = evaluation;

  if (treatment !== 'control') {
    log.info(`Split: ${splitName}. Key: ${matchingKey}. Evaluation: ${treatment}`);
  } else {
    log.warn(`Split ${splitName} doesn't exist`);
  }

  impressionsTracker({
    feature: splitName,
    keyName: matchingKey,
    treatment,
    time: Date.now(),
    bucketingKey,
    label,
    changeNumber
  });

  stopLatencyTracker();

  return evaluation.treatment;
}

function ClientFactory(context): SplitClient {
  const storage = context.get(context.constants.STORAGE);
  const metricCollectors = context.get(context.constants.COLLECTORS);
  const impressionsTracker = PassTracker(storage.impressions);

  return {
    getTreatment(key: SplitKey, splitName: string, attributes: ?Object): AsyncValue<string> {
      const stopLatencyTracker = tracker.start(tracker.TaskNames.SDK_GET_TREATMENT, metricCollectors);
      const evaluation = evaluator(key, splitName, attributes, storage);

      if (thenable(evaluation)) {
        return evaluation.then(res => getTreatmentAvailable(res, splitName, key, stopLatencyTracker, impressionsTracker));
      } else {
        return getTreatmentAvailable(evaluation, splitName, key, stopLatencyTracker, impressionsTracker);
      }
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
    },
    track(key, trafficTypeId, eventTypeId, eventValue) {
      let matchingKey;
      try {
        matchingKey = keyParser(key).matchingKey;
      } catch (e) {
        return false; // If the key is invalid, return false.
      }

      if (typeof trafficTypeId !== 'string' || typeof eventTypeId !== 'string') {
        return false; // If the trafficType or eventType are invalid, return false.
      }
      // Values that are no doubles should be taken as 0 (@Pato's)
      const value = isFinite(eventValue) ? eventValue : 0;

      storage.events.track({
        eventTypeId,
        trafficTypeId,
        value,
        key : matchingKey,
        timestamp : Date.now()
      });

      return true;
    }
  };

}

module.exports = ClientFactory;
