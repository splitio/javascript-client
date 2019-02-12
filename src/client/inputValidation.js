import ClientFactory from './client';
import {
  validateAttributes,
  validateEvent,
  validateEventValue,
  validateKey,
  validateSplit,
  validateSplits,
  validateTrafficType,
  validateIfOperational
} from '../utils/inputValidation';
import { STORAGE_REDIS, CONTROL } from '../utils/constants';

/**
 * We will validate the input before actually executing the client methods. We should "guard" the client here,
 * while not polluting the "real" implementation of those methods.
 */
function ClientInputValidationLayer(context, isKeyBinded, isTTBinded) {
  const settings = context.get(context.constants.SETTINGS);
  const isStorageSync = settings.storage.type !== STORAGE_REDIS;

  const client = ClientFactory(context);
  const clientGetTreatment = client.getTreatment;
  const clientGetTreatments = client.getTreatments;
  const clientTrack = client.track;

  client.getTreatment = function getTreatment(maybeKey, maybeSplit, maybeAttributes) {
    const key = isKeyBinded ? maybeKey : validateKey(maybeKey, 'getTreatment');
    const split = validateSplit(maybeSplit, 'getTreatment');
    const attributes = validateAttributes(maybeAttributes, 'getTreatment');
    const isOperational = validateIfOperational(context);

    if (isOperational && key && split && attributes !== false) {
      return clientGetTreatment(key, split, attributes);
    } else {
      if (isStorageSync) return CONTROL;

      return Promise.resolve(CONTROL);
    }
  };
  client.getTreatments = function getTreatments(maybeKey, maybeSplits, maybeAttributes) {
    const key = isKeyBinded ? maybeKey : validateKey(maybeKey, 'getTreatments');
    const splits = validateSplits(maybeSplits, 'getTreatments');
    const attributes = validateAttributes(maybeAttributes, 'getTreatments');
    const isOperational = validateIfOperational(context);

    if (isOperational && key && splits && attributes !== false) {
      return clientGetTreatments(key, splits, attributes);
    } else {
      const res = {};
      if (splits) splits.forEach(split => res[split] = CONTROL);

      if (isStorageSync) return res;

      return Promise.resolve(res);
    }
  };
  client.track = function track(maybeKey, maybeTT, maybeEvent, maybeEventValue) {
    const key = isKeyBinded ? maybeKey : validateKey(maybeKey, 'track');
    const tt = isTTBinded ? maybeTT : validateTrafficType(maybeTT, 'track');
    const event = validateEvent(maybeEvent, 'track');
    const eventValue = validateEventValue(maybeEventValue, 'track');
    const isOperational = validateIfOperational(context);

    if (isOperational && key && tt && event && eventValue !== false) {
      return clientTrack(key, tt, event, eventValue);
    } else {
      if (isStorageSync) return false;

      return Promise.resolve(false);
    }
  };

  return client;
}

export default ClientInputValidationLayer;
