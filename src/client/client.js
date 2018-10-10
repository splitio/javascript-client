import logFactory from '../utils/logger';
const log = logFactory('splitio-client');
import evaluator from '../engine/evaluator';
import ImpressionsTracker from '../trackers/impressions';
import tracker from '../utils/timeTracker';
import thenable from '../utils/promise/thenable';
import keyParser from '../utils/key/parser';
import { matching, bucketing } from '../utils/key/factory';
import validateTrackArguments from '../utils/track/validate';

function getTreatmentAvailable(
  evaluation,
  splitName,
  key,
  attributes,
  stopLatencyTracker,
  impressionsTracker
) {
  const matchingKey = matching(key);
  const bucketingKey = bucketing(key);

  const { treatment, label , changeNumber } = evaluation;

  if (treatment !== 'control') {
    log.info(`Split: ${splitName}. Key: ${matchingKey}. Evaluation: ${treatment}`);
  } else if (matchingKey !== false) {
    log.warn(`Split ${splitName} doesn't exist`);
  }

  /** Don't push impressions if matchingKey is invalid */
  if (matchingKey !== false) {
    impressionsTracker({
      feature: splitName,
      keyName: matchingKey,
      treatment,
      time: Date.now(),
      bucketingKey,
      label,
      changeNumber
    }, attributes);
  } else {
    log.warn('Impression not collected since matchingKey is not a valid key');
  }

  stopLatencyTracker();

  return evaluation.treatment;
}

function ClientFactory(context) {
  const storage = context.get(context.constants.STORAGE);
  const metricCollectors = context.get(context.constants.COLLECTORS);
  const impressionsTracker = ImpressionsTracker(context);

  return {
    getTreatment(key, splitName, attributes) {
      const stopLatencyTracker = tracker.start(tracker.TaskNames.SDK_GET_TREATMENT, metricCollectors);
      const evaluation = evaluator(key, splitName, attributes, storage);

      if (thenable(evaluation)) {
        return evaluation.then(res => getTreatmentAvailable(res, splitName, key, attributes, stopLatencyTracker, impressionsTracker));
      } else {
        return getTreatmentAvailable(evaluation, splitName, key, attributes, stopLatencyTracker, impressionsTracker);
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
      const areValidTrackArguments = validateTrackArguments(key, trafficTypeName, eventTypeId, eventValue);

      if (!areValidTrackArguments) {
        return false;
      }

      const matchingKey =  keyParser(key).matchingKey;
      const timestamp = Date.now();
      // if eventValue is undefined we convert it to null so the BE can handle a non existence value
      const value = eventValue === undefined ? null : eventValue;

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
