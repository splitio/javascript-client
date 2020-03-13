import { isString } from '../lang';
import thenable from '../promise/thenable';
import { LOCALHOST_MODE } from '../constants';
import logFactory from '../logger';
const log = logFactory('');

const CAPITAL_LETTERS_REGEX = /[A-Z]/;

export function validateTrafficType(maybeTT, method) {
  if (maybeTT == undefined) { // eslint-disable-line eqeqeq
    log.error(`${method}: you passed a null or undefined traffic_type_name, traffic_type_name must be a non-empty string.`);
  } else if (!isString(maybeTT)) {
    log.error(`${method}: you passed an invalid traffic_type_name, traffic_type_name must be a non-empty string.`);
  } else {
    if (maybeTT.length === 0) {
      log.error(`${method}: you passed an empty traffic_type_name, traffic_type_name must be a non-empty string.`);
    } else {
      if (CAPITAL_LETTERS_REGEX.test(maybeTT)) {
        log.warn(`${method}: traffic_type_name should be all lowercase - converting string to lowercase.`);
        maybeTT = maybeTT.toLowerCase();
      }

      return maybeTT;
    }
  }

  return false;
}

function logTTExistanceWarning(method, ttName) {
  log.warn(`${method}: Traffic Type ${ttName} does not have any corresponding Splits in this environment, make sure you're tracking your events to a valid traffic type defined in the Split console.`);
}

/**
 * Separated from the previous method since on some cases it'll be async.
 */
export function validateTrafficTypeExistance(maybeTT, context, method) {
  const isReady = context.get(context.constants.READY, true);
  const settings = context.get(context.constants.SETTINGS);
  const splitsStorage = context.get(context.constants.STORAGE).splits;

  // If not ready or in localhost mode, we won't run the validation
  if (!isReady || settings.mode === LOCALHOST_MODE) return true;

  const res = splitsStorage.trafficTypeExists(maybeTT);

  if (thenable(res)) {
    res.then(function(isValid) {
      if (!isValid) logTTExistanceWarning(method, maybeTT);

      return isValid; // propagate result
    });
  } else {
    if (!res) logTTExistanceWarning(method, maybeTT);
  }

  return res;
}
