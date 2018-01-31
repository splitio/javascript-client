// I'll need to fix first 'isomorphic-fetch' to be transpiled using
// babel-runtime before remove this line of code.
import 'core-js/es6/promise';

import isFinite from 'lodash/isFinite';
import logFactory from '../utils/logger';
const log = logFactory('splitio-client');
import evaluator from '../engine/evaluator';
import PassTracker from '../tracker/PassThrough';
import tracker from '../utils/timeTracker';
import keyParser from '../utils/key/parser';
import thenable from '../utils/promise/thenable';
import { matching, bucketing } from '../utils/key/factory';

function getTreatmentAvailable(
  evaluation,
  splitName,
  key,
  stopLatencyTracker,
  impressionsTracker
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

function ClientFactory(context) {
  const storage = context.get(context.constants.STORAGE);
  const metricCollectors = context.get(context.constants.COLLECTORS);
  const impressionsTracker = PassTracker(storage.impressions);

  return {
    getTreatment(key, splitName, attributes) {
      const stopLatencyTracker = tracker.start(tracker.TaskNames.SDK_GET_TREATMENT, metricCollectors);
      const evaluation = evaluator(key, splitName, attributes, storage);

      if (thenable(evaluation)) {
        return evaluation.then(res => getTreatmentAvailable(res, splitName, key, stopLatencyTracker, impressionsTracker));
      } else {
        return getTreatmentAvailable(evaluation, splitName, key, stopLatencyTracker, impressionsTracker);
      }
    },
    getTreatments(key, splitNames, attributes) {
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
    track(key, trafficTypeName, eventTypeId, eventValue) {
      let matchingKey;
      try {
        matchingKey = keyParser(key).matchingKey;
      } catch (e) {
        log.warn('Attempting to track event with invalid key. Event will be discarded.');
        return false; // If the key is invalid, return false.
      }

      if (typeof trafficTypeName !== 'string' || typeof eventTypeId !== 'string') {
        log.warn('Attempting to track event but Traffic Type and/or Event Type are invalid. Event will be discarded.');
        return false; // If the trafficType or eventType are invalid, return false.
      }

      const timestamp = Date.now();
      // Values that are no doubles should be taken as 0 (@Pato's)
      const value = isFinite(eventValue) ? eventValue : 0;

      storage.events.track({
        eventTypeId,
        trafficTypeName,
        value,
        timestamp,
        key: matchingKey,
      });

      log.info(`Successfully qeued event of type "${eventTypeId}" for traffic type "${trafficTypeName}". Key: ${matchingKey}. Value: ${value}. Timestamp: ${timestamp}.`);

      return true;
    }
  };
}

export default ClientFactory;
