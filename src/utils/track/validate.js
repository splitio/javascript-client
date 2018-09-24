import { isString } from '../../utils/lang';
/**
Copyright 2016 Split Software

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
**/
import { isFinite } from '../lang';
import keyParser from '../key/parser';
import keyLogError from '../key/logError';
import logError from './logError';
import logFactory from '../logger';
const log = logFactory('splitio-client');

function validateTrackArguments(key, trafficTypeName, eventTypeId, value) {
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

  if (value !== null && value !== undefined && !isFinite(value)) {
    log.error('track: value must be a number');
    return false;
  }

  return true;
}

export default validateTrackArguments;
