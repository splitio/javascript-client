import objectAssign from 'object-assign';
import ClientFactory from './client';
import {
  validateAttributes,
  validateEvent,
  validateEventValue,
  validateEventProperties,
  validateKey,
  validateSplit,
  validateSplits,
  validateTrafficType,
  validateIfDestroyed,
  validateIfReady
} from '../utils/inputValidation';
import { startsWith } from '../utils/lang';
import { STORAGE_REDIS, CONTROL, CONTROL_WITH_CONFIG } from '../utils/constants';

/**
 * We will validate the input before actually executing the client methods. We should "guard" the client here,
 * while not polluting the "real" implementation of those methods.
 */
function ClientInputValidationLayer(context, isKeyBinded, isTTBinded) {
  const settings = context.get(context.constants.SETTINGS);
  const isStorageSync = settings.storage.type !== STORAGE_REDIS;
  // instantiate the client
  const client = ClientFactory(context);
  // Keep a reference to the original methods
  const clientGetTreatment = client.getTreatment;
  const clientGetTreatmentWithConfig = client.getTreatmentWithConfig;
  const clientGetTreatments = client.getTreatments;
  const clientGetTreatmentsWithConfig = client.getTreatmentsWithConfig;
  const clientTrack = client.track;

  /**
   * Avoid repeating this validations code
   */
  function validateEvaluationParams(maybeKey, maybeSplitOrSplits, maybeAttributes, methodName) {
    const multi = startsWith(methodName, 'getTreatments');
    const key = isKeyBinded ? maybeKey : validateKey(maybeKey, methodName);
    const splitOrSplits = multi ? validateSplits(maybeSplitOrSplits, methodName) : validateSplit(maybeSplitOrSplits, methodName);
    const attributes = validateAttributes(maybeAttributes, methodName);
    const isOperational = validateIfDestroyed(context);

    validateIfReady(context, methodName);

    const valid = isOperational && key && splitOrSplits && attributes !== false;

    return {
      valid,
      key,
      splitOrSplits,
      attributes
    };
  }

  client.getTreatment = function getTreatment(maybeKey, maybeSplit, maybeAttributes) {
    const params = validateEvaluationParams(maybeKey, maybeSplit, maybeAttributes, 'getTreatment');

    if (params.valid) {
      return clientGetTreatment(params.key, params.splitOrSplits, params.attributes);
    } else {
      if (isStorageSync) return CONTROL;

      return Promise.resolve(CONTROL);
    }
  };

  client.getTreatmentWithConfig = function getTreatmentWithConfig(maybeKey, maybeSplit, maybeAttributes) {
    const params = validateEvaluationParams(maybeKey, maybeSplit, maybeAttributes, 'getTreatmentWithConfig');

    if (params.valid) {
      return clientGetTreatmentWithConfig(params.key, params.splitOrSplits, params.attributes);
    } else {
      if (isStorageSync) return objectAssign({}, CONTROL_WITH_CONFIG);

      return Promise.resolve(objectAssign({}, CONTROL_WITH_CONFIG));
    }
  };

  client.getTreatments = function getTreatments(maybeKey, maybeSplits, maybeAttributes) {
    const params = validateEvaluationParams(maybeKey, maybeSplits, maybeAttributes, 'getTreatments');

    if (params.valid) {
      return clientGetTreatments(params.key, params.splitOrSplits, params.attributes);
    } else {
      const res = {};
      if (params.splitOrSplits) params.splitOrSplits.forEach(split => res[split] = CONTROL);

      if (isStorageSync) return res;

      return Promise.resolve(res);
    }
  };

  client.getTreatmentsWithConfig = function getTreatmentsWithConfig(maybeKey, maybeSplits, maybeAttributes) {
    const params = validateEvaluationParams(maybeKey, maybeSplits, maybeAttributes, 'getTreatmentsWithConfig');

    if (params.valid) {
      return clientGetTreatmentsWithConfig(params.key, params.splitOrSplits, params.attributes);
    } else {
      const res = {};
      if (params.splitOrSplits) params.splitOrSplits.forEach(split => res[split] = objectAssign({}, CONTROL_WITH_CONFIG));

      if (isStorageSync) return res;

      return Promise.resolve(res);
    }
  };

  client.track = function track(maybeKey, maybeTT, maybeEvent, maybeEventValue, maybeProperties) {
    const key = isKeyBinded ? maybeKey : validateKey(maybeKey, 'track');
    const tt = isTTBinded ? maybeTT : validateTrafficType(maybeTT, 'track');
    const event = validateEvent(maybeEvent, 'track');
    const eventValue = validateEventValue(maybeEventValue, 'track');
    const { properties, size } = validateEventProperties(maybeProperties, 'track');
    const isOperational = validateIfDestroyed(context);

    if (isOperational && key && tt && event && eventValue !== false && properties !== false) {
      return clientTrack(key, tt, event, eventValue, properties, size);
    } else {
      if (isStorageSync) return false;

      return Promise.resolve(false);
    }
  };

  return client;
}

export default ClientInputValidationLayer;
