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

import logFactory from '../../utils/logger';
const log = logFactory('splitio-engine:sanitize');
import { isObject, uniq, toString, toNumber } from '../../utils/lang';
import { zeroSinceHH, zeroSinceSS } from '../convertions';
import { matcherTypes, matcherDataTypes } from '../matchers/types';

function sanitizeNumber(val) {
  const num = toNumber(val);
  return isNaN(num) ? undefined : num;
}

function sanitizeString(val) {
  let valueToSanitize = val;

  if (isObject(val)) {
    // If the value is an object and is not a key, discard it.
    valueToSanitize = val.matchingKey ? val.matchingKey : undefined;
  }

  const str = toString(valueToSanitize);
  return str ? str : undefined;
}

function sanitizeArray(val) {
  const arr = Array.isArray(val) ? uniq(val.map(e => e + '')) : [];
  return arr.length ? arr : undefined;
}

function sanitizeBoolean(val) {
  if (val === true || val === false) return val;

  if (typeof val === 'string') {
    const lowerCaseValue = val.toLocaleLowerCase();

    if (lowerCaseValue === 'true') return true;
    if (lowerCaseValue === 'false') return false;
  }

  return undefined;
}

function dependencyProcessor(sanitizedValue, attributes) {
  return {
    key: sanitizedValue,
    attributes
  };
}

/**
 * We can define a pre-processing for the value, to be executed prior to matcher evaluation.
 */
function getProcessingFunction(matcherTypeID, dataType) {
  switch (matcherTypeID) {
    case matcherTypes.EQUAL_TO:
      return dataType === 'DATETIME' ? zeroSinceHH : undefined;
    case matcherTypes.GREATER_THAN_OR_EQUAL_TO:
    case matcherTypes.LESS_THAN_OR_EQUAL_TO:
    case matcherTypes.BETWEEN:
      return dataType === 'DATETIME' ? zeroSinceSS : undefined;
    case matcherTypes.IN_SPLIT_TREATMENT:
      return dependencyProcessor;
    default:
      return undefined;
  }
}

function sanitizeValue(matcherTypeID, value, dataType, attributes) {
  const processor = getProcessingFunction(matcherTypeID, dataType);
  let sanitizedValue;

  switch (dataType) {
    case matcherDataTypes.NUMBER:
    case matcherDataTypes.DATETIME:
      sanitizedValue = sanitizeNumber(value);
      break;
    case matcherDataTypes.STRING:
      sanitizedValue = sanitizeString(value);
      break;
    case matcherDataTypes.SET:
      sanitizedValue = sanitizeArray(value);
      break;
    case matcherDataTypes.BOOLEAN:
      sanitizedValue = sanitizeBoolean(value);
      break;
    case matcherDataTypes.NOT_SPECIFIED:
      sanitizedValue = value;
      break;
    default:
      sanitizedValue = undefined;
  }

  if (processor) {
    sanitizedValue = processor(sanitizedValue, attributes);
  }

  log.debug(`Attempted to sanitize [${value}] which should be of type [${dataType}]. \n Sanitized and processed value => [${sanitizedValue instanceof Object ? JSON.stringify(sanitizedValue) : sanitizedValue}]`);

  return sanitizedValue;
}

export default sanitizeValue;
