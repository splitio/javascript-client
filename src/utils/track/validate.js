import isString from 'lodash/isString';
import isFinite from 'lodash/isFinite';
import keyParser from '../key/parser';
import keyLogError from '../key/logError';
import logError from './logError';
import logFactory from '../logger';
const log = logFactory('splitio-client');

function validateTrackArguments(key, eventTypeId, trafficTypeName, value) {
  const parsedKey = keyParser(key);
  if (parsedKey === false) {
    keyLogError('track', key);
    return false;
  }

  if (trafficTypeName === null || trafficTypeName === undefined 
    || !isString(trafficTypeName) 
    || (isString(trafficTypeName) && !trafficTypeName.length)) {
    logError(trafficTypeName, 'traffic_type_name', false);
    return false;
  }

  if (eventTypeId === null || eventTypeId === undefined || !isString(trafficTypeName)) {
    logError(eventTypeId, 'event_name');    
    return false;
  }

  if (value !== null && (value === undefined || !isFinite(value))) {
    log.error('track: value must be a number');
    return false;
  }

  return true;
}

export default validateTrackArguments;