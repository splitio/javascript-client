import logFactory from '../utils/logger';
const log = logFactory('splitio-client');
import { evaluateFeature, evaluateFeatures } from '../engine/evaluator';
import ImpressionsTracker from '../trackers/impressions';
import EventTracker from '../trackers/event';
import tracker from '../utils/timeTracker';
import thenable from '../utils/promise/thenable';
import { matching, bucketing } from '../utils/key/factory';
/* asynchronous validations that live on the client. */
import { validateSplitExistance, validateTrafficTypeExistance } from '../utils/inputValidation';
import { SDK_NOT_READY } from '../utils/labels';
import { CONTROL } from '../utils/constants';

function ClientFactory(context) {
  const storage = context.get(context.constants.STORAGE);
  const metricCollectors = context.get(context.constants.COLLECTORS);
  const impressionsTracker = ImpressionsTracker(context);
  const eventTracker = EventTracker(context);

  function getTreatment(key, splitName, attributes, withConfig = false) {
    const taskToBeTracked = tracker.TaskNames[withConfig ? 'SDK_GET_TREATMENT_WITH_CONFIG' : 'SDK_GET_TREATMENT'];
    const stopLatencyTracker = tracker.start(taskToBeTracked, metricCollectors);
    const evaluation = evaluateFeature(key, splitName, attributes, storage);

    const wrapUp = (evaluationResult) => {
      const treatment = processEvaluation(evaluationResult, splitName, key, attributes, withConfig, `getTreatment${withConfig ? 'withConfig' : ''}`);
      impressionsTracker.track();
      stopLatencyTracker();
      return treatment;
    };

    return thenable(evaluation) ? evaluation.then((res) => wrapUp(res)) : wrapUp(evaluation);
  }

  function getTreatmentWithConfig(key, splitName, attributes) {
    return getTreatment(key, splitName, attributes, true);
  }

  function getTreatments(key, splitNames, attributes, withConfig = false) {
    const taskToBeTracked = tracker.TaskNames[withConfig ? 'SDK_GET_TREATMENTS_WITH_CONFIG' : 'SDK_GET_TREATMENTS'];
    const stopLatencyTracker = tracker.start(taskToBeTracked, metricCollectors);

    const wrapUp = (evaluationResults) => {
      const results = {};
      Object.keys(evaluationResults).forEach(splitName => {
        results[splitName] = processEvaluation(evaluationResults[splitName], splitName, key, attributes, withConfig, `getTreatments${withConfig ? 'withConfig' : ''}`);
      });
      impressionsTracker.track();
      stopLatencyTracker();
      return results;
    };

    const evaluations = evaluateFeatures(key, splitNames, attributes, storage);

    return thenable(evaluations) ? evaluations.then((res) => wrapUp(res)) : wrapUp(evaluations);
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
      impressionsTracker.queue({
        feature: splitName,
        keyName: matchingKey,
        treatment,
        time: Date.now(),
        bucketingKey,
        label,
        changeNumber
      }, attributes);
    }

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

    return eventTracker.track(eventData, size);
  }

  return {
    getTreatment, getTreatmentWithConfig,
    getTreatments, getTreatmentsWithConfig,
    track
  };
}

export default ClientFactory;
