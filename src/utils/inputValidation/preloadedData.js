import { isObject, isString, numberIsFinite } from '../lang';
import { validateSplit } from '../inputValidation';
import logFactory from '../logger';
const log = logFactory('');

function validateTimestampData(maybeTimestamp, method, item) {
  if (numberIsFinite(maybeTimestamp) && maybeTimestamp > -1) return true;
  log.error(`${method}: preloadedData.${item} must be a positive number.`);
  return false;
}

function validateSplitsData(maybeSplitsData, method) {
  if (isObject(maybeSplitsData)) {
    const splitNames = Object.keys(maybeSplitsData);
    if (splitNames.length === 0) log.warn(`${method}: preloadedData.splitsData doesn't contain split definitions.`);
    // @TODO in the future, consider handling the possibility of having parsed definitions of splits
    if (splitNames.every(splitName => validateSplit(splitName, method) && isString(maybeSplitsData[splitName]))) return true;
  }
  log.error(`${method}: preloadedData.splitsData must be a map of split names to their serialized definitions.`);
  return false;
}

function validateMySegmentsData(maybeMySegmentsData, method) {
  if (isObject(maybeMySegmentsData)) {
    const userKeys = Object.keys(maybeMySegmentsData);
    if (userKeys.every(userKey => {
      const segmentNames = maybeMySegmentsData[userKey];
      // an empty list is valid
      return Array.isArray(segmentNames) && segmentNames.every(segmentName => isString(segmentName));
    })) return true;
  }
  log.error(`${method}: preloadedData.mySegmentsData must be a map of user keys to their list of segment names.`);
  return false;
}

function validateSegmentsData(maybeSegmentsData, method) {
  if (isObject(maybeSegmentsData)) {
    const segmentNames = Object.keys(maybeSegmentsData);
    if (segmentNames.every(segmentName => isString(maybeSegmentsData[segmentName]))) return true;
  }
  log.error(`${method}: preloadedData.segmentsData must be a map of segment names to their serialized definitions.`);
  return false;
}

export function validatePreloadedData(maybePreloadedData, method) {
  if (!isObject(maybePreloadedData)) {
    log.error(`${method}: preloadedData must be an object.`);
  } else if (
    validateTimestampData(maybePreloadedData.lastUpdated, method, 'lastUpdated') &&
    validateTimestampData(maybePreloadedData.since, method, 'since') &&
    validateSplitsData(maybePreloadedData.splitsData, method) &&
    (!maybePreloadedData.mySegmentsData || validateMySegmentsData(maybePreloadedData.mySegmentsData, method)) &&
    (!maybePreloadedData.segmentsData || validateSegmentsData(maybePreloadedData.segmentsData, method))
  ) {
    return true;
  }
  return false;
}