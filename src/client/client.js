import logFactory from '../utils/logger';
const log = logFactory('splitio-client');
import { evaluateFeature, evaluateFeatures } from '../engine/evaluator';
import ImpressionTracker from '../trackers/impression';
import ImpressionsTracker from '../trackers/impressions';
import tracker from '../utils/timeTracker';
import thenable from '../utils/promise/thenable';
import { matching, bucketing } from '../utils/key/factory';
/* asynchronous validations that live on the client. */
import { validateSplitExistance, validateTrafficTypeExistance } from '../utils/inputValidation';
import { SDK_NOT_READY } from '../utils/labels';
import { CONTROL } from '../utils/constants';

function queueEventsCallback({
  eventTypeId, trafficTypeName, key, value, timestamp, properties
}, tracked) {
  // Logging every prop would be too much.
  const msg = `event of type "${eventTypeId}" for traffic type "${trafficTypeName}". Key: ${key}. Value: ${value}. Timestamp: ${timestamp}. ${properties ? 'With properties.' : 'With no properties.'}`;

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
    const evaluation = evaluateFeature(key, splitName, attributes, storage);

    if (thenable(evaluation)) {
      return evaluation.then(res => processEvaluation(res, splitName, key, attributes, stopLatencyTracker, impressionTracker.track, withConfig, `getTreatment${withConfig ? 'withConfig' : ''}`));
    } else {
      return processEvaluation(evaluation, splitName, key, attributes, stopLatencyTracker, impressionTracker.track, withConfig, `getTreatment${withConfig ? 'withConfig' : ''}`);
    }
  }

  function getTreatmentWithConfig(key, splitName, attributes) {
    return getTreatment(key, splitName, attributes, true);
  }

  function getTreatments(key, splitNames, attributes, withConfig = false) {
    const taskToBeTracked = tracker.TaskNames[withConfig ? 'SDK_GET_TREATMENTS_WITH_CONFIG' : 'SDK_GET_TREATMENTS'];
    const stopLatencyTracker = tracker.start(taskToBeTracked, metricCollectors);
    const results = {};

    const wrapUp = (evaluationResults) => {
      Object.keys(evaluationResults).forEach(splitName => {
        results[splitName] = processEvaluation(evaluationResults[splitName], splitName, key, attributes, false, impressionsTracker.queue, withConfig, `getTreatments${withConfig ? 'withConfig' : ''}`);
      });
      impressionsTracker.track();
      stopLatencyTracker();
      return results;
    };

    const evaluations = evaluateFeatures(key, splitNames, attributes, storage);

    return (thenable(evaluations)) ? evaluations.then((res) => wrapUp(res)) : wrapUp(evaluations);
  }

  function getTreatmentsWithConfig(key, splitNames, attributes) {
    return getTreatments(key, splitNames, attributes, true);
  }

  // Internal function
  function processEvaluation(
    evaluation,
    splitName,
    key,
    attributes,
    stopLatencyTracker = false,
    impressionsTracker,
    withConfig,
    invokingMethodName
  ) {
    const isSdkReady = context.get(context.constants.READY, true) || context.get(context.constants.READY_FROM_CACHE, true);
    const matchingKey = matching(key);
    const bucketingKey = bucketing(key);

    // If the SDK was not ready, treatment may be incorrect due to having Splits but not segments data.
    if (!isSdkReady) {
      evaluation = { treatment: CONTROL, label: SDK_NOT_READY };
    }

    const { treatment, label, changeNumber, config = null } = evaluation;
    log.info(`Split: ${splitName}. Key: ${matchingKey}. Evaluation: ${treatment}. Label: ${label}`);

    if (validateSplitExistance(context, splitName, label, invokingMethodName)) {
      log.info('Queueing corresponding impression.');
      impressionsTracker({
        feature: splitName,
        keyName: matchingKey,
        treatment,
        time: Date.now(),
        bucketingKey,
        label,
        changeNumber
      }, attributes);
    }

    stopLatencyTracker && stopLatencyTracker();

    if (withConfig) {
      return {
        treatment,
        config
      };
    }

    return treatment;
  }

  function track(key, trafficTypeName, eventTypeId, value = null, properties = null, size = 1024) {
    const matchingKey = matching(key);
    const timestamp = Date.now();
    const eventData = {
      eventTypeId,
      trafficTypeName,
      value,
      timestamp,
      key: matchingKey,
      properties
    };

    // This may be async but we only warn, we don't actually care if it is valid or not in terms of queueing the event.
    validateTrafficTypeExistance(trafficTypeName, context, 'track');

    const tracked = storage.events.track(eventData, size);

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
