import { isObject, isString } from '../lang';
import logFactory from '../logger';
const log = logFactory('', {
  displayAllErrors: true
});

function validateSinceData(maybeSince, method) {
  if (maybeSince > -1) return true;
  log.error(`${method}: serializedData.since must be a positive number.`);
  return false;
}

function validateSplitsData(maybeSplitsData, method) {
  if (isObject(maybeSplitsData)) {
    const splitNames = Object.keys(maybeSplitsData);
    if (splitNames.length > 0 && splitNames.every(splitName => isString(maybeSplitsData[splitName]))) return true;
  }
  log.error(`${method}: serializedData.splitData must be a map of split names to their serialized definitions.`);
  return false;
}

function validateMySegmentsData(maybeMySegmentsData, method) {
  if (isObject(maybeMySegmentsData)) {
    const userKeys = Object.keys(maybeMySegmentsData);
    if (userKeys.length > 0 && userKeys.every(userKey => {
      const segmentNames = maybeMySegmentsData[userKey];
      // an empty list is valid
      return Array.isArray(segmentNames) && segmentNames.every(segmentName => isString(segmentName));
    })) return true;
  }
  log.error(`${method}: serializedData.mySegmentsData must be a map of user keys to their list of segment names.`);
  return false;
}

function validateSegmentsData(maybeSegmentsData, method) {
  if (isObject(maybeSegmentsData)) {
    const segmentNames = Object.keys(maybeSegmentsData);
    if (segmentNames.length > 0 && segmentNames.every(segmentName => isString(maybeSegmentsData[segmentName]))) return true;
  }
  log.error(`${method}: serializedData.segmentsData must be a map of segment names to their serialized definitions.`);
  return false;
}

export function validateSerializedData(maybeSerializedData, method) {
  if (!isObject(maybeSerializedData)) {
    log.error(`${method}: serializedData must be an object.`);
  } else if (
    validateSinceData(maybeSerializedData.since, method) &&
    validateSplitsData(maybeSerializedData.splitData, method) &&
    (!maybeSerializedData.mySegmentsData || validateMySegmentsData(maybeSerializedData.mySegmentsData, method)) &&
    (!maybeSerializedData.segmentsData || validateSegmentsData(maybeSerializedData.segmentsData, method))
  ) {
    return true;
  }
  return false;
}