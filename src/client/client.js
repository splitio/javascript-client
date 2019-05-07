import logFactory from '../utils/logger';
const log = logFactory('splitio-client');
import evaluator from '../engine/evaluator';
import ImpressionTracker from '../trackers/impression';
import ImpressionsTracker from '../trackers/impressions';
import tracker from '../utils/timeTracker';
import thenable from '../utils/promise/thenable';
import { matching, bucketing } from '../utils/key/factory';
import { CONTROL } from '../utils/constants';

function getTreatmentAvailable(
  evaluation,
  splitName,
  key,
  attributes,
  stopLatencyTracker = false,
  impressionsTracker,
  withConfig
) {
  const matchingKey = matching(key);
  const bucketingKey = bucketing(key);

  const { treatment, label , changeNumber, config = null } = evaluation;

  if (treatment !== CONTROL) {
    log.info(`Split: ${splitName}. Key: ${matchingKey}. Evaluation: ${treatment}`);
  } else if (matchingKey !== false) {
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
  }, attributes);

  stopLatencyTracker && stopLatencyTracker();

  if (withConfig) {
    return {
      treatment,
      config
    };
  }

  return treatment;
}

function queueEventsCallback({
  eventTypeId, trafficTypeName, key, value, timestamp
}, tracked) {
  const msg = `event of type "${eventTypeId}" for traffic type "${trafficTypeName}". Key: ${key}. Value: ${value}. Timestamp: ${timestamp}.`;

  if (tracked) {
    log.info(`Successfully qeued ${msg}`);
  } else {
    log.warn(`Failed to queue ${msg}`);
  }

  return tracked;
}

function ClientFactory(context) {
  const storage = context.get(context.constants.STORAGE);
  const metricCollectors = context.get(context.constants.COLLECTORS);
  const impressionTracker = ImpressionTracker(context);
  const impressionsTracker = ImpressionsTracker(context);

  function getTreatment(key, splitName, attributes, withConfig = false) {
    const taskToBeTracked = tracker.TaskNames[withConfig ? 'SDK_GET_TREATMENT_WITH_CONFIG' : 'SDK_GET_TREATMENT'];
    const stopLatencyTracker = tracker.start(taskToBeTracked, metricCollectors);
    const evaluation = evaluator(key, splitName, attributes, storage);

    if (thenable(evaluation)) {
      return evaluation.then(res => getTreatmentAvailable(res, splitName, key, attributes, stopLatencyTracker, impressionTracker.track, withConfig));
    } else {
      return getTreatmentAvailable(evaluation, splitName, key, attributes, stopLatencyTracker, impressionTracker.track, withConfig);
    }
  }

  function getTreatmentWithConfig(key, splitName, attributes) {
    return getTreatment(key, splitName, attributes, true);
  }

  function getTreatments(key, splitNames, attributes, withConfig = false) {
    const taskToBeTracked = tracker.TaskNames[withConfig ? 'SDK_GET_TREATMENTS_WITH_CONFIG' : 'SDK_GET_TREATMENTS'];
    const stopLatencyTracker = tracker.start(taskToBeTracked, metricCollectors);
    const results = {};
    const thenables = [];
    let i;

    for (i = 0; i < splitNames.length; i ++) {
      const splitName = splitNames[i];
      const evaluation = evaluator(key, splitName, attributes, storage);

      if (thenable(evaluation)) {
        // If treatment returns a promise as it is being evaluated, save promise for progress tracking.
        thenables.push(evaluation);
        evaluation.then((res) => {
          // set the treatment on the cb;
          results[splitName] = getTreatmentAvailable(res, splitName, key, attributes, false, impressionsTracker.queue, withConfig);
        });
      } else {
        results[splitName] = getTreatmentAvailable(evaluation, splitName, key, attributes, false, impressionsTracker.queue, withConfig);
      }
    }

    const wrapUp = () => {
      impressionsTracker.track();
      stopLatencyTracker();
      // After all treatments are resolved, we return the mapping object.
      return results;
    };

    if (thenables.length) {
      return Promise.all(thenables).then(wrapUp);
    } else {
      return wrapUp();
    }
  }

  function getTreatmentsWithConfig(key, splitNames, attributes) {
    return getTreatments(key, splitNames, attributes, true);
  }

  function track(key, trafficTypeName, eventTypeId, eventValue) {
    const matchingKey = matching(key);
    const timestamp = Date.now();
    // if eventValue is undefined we convert it to null so the BE can handle a non existent value
    const value = eventValue === undefined ? null : eventValue;
    const eventData = {
      eventTypeId,
      trafficTypeName,
      value,
      timestamp,
      key: matchingKey,
    };
    const tracked = storage.events.track(eventData);

    if (thenable(tracked)) {
      return tracked.then(queueEventsCallback.bind(null, eventData));
    } else {
      return queueEventsCallback(eventData, tracked);
    }
  }

  return {
    getTreatment, getTreatmentWithConfig,
    getTreatments, getTreatmentsWithConfig,
    track
  };
}

export default ClientFactory;
