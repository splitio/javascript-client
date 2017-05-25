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

// @flow

'use strict';

const log = require('../../utils/logger')('splitio-engine:sanitize');

const isArray = require('lodash/isArray');
const uniq = require('lodash/uniq');
const toString = require('lodash/toString');
const toNumber = require('lodash/toNumber');

const {
  date: {
    zeroSinceHH,
    zeroSinceSS
  }
} = require('../convertions');

const matcherTypes = require('../matchers/types');
const MATCHERS = matcherTypes.enum;
const DATA_TYPES = matcherTypes.dataTypes;

function sanitizeNumber(val): ?number {
  const num = toNumber(val);
  return isNaN(num) ? undefined : num;
}

function sanitizeString(val): ?string {
  const str = toString(val);
  return str ? str : undefined;
}

function sanitizeArray(val): ?Array<string> {
  const arr = isArray(val) ? uniq(val.map(e => e + '')) : [];
  return arr.length ? arr : undefined;
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
function getProcessingFunction(matcherTypeID: number, dataType?: string): ?Function {
  switch (matcherTypeID) {
    case MATCHERS.EQUAL_TO:
      return dataType === 'DATETIME' ? zeroSinceHH : undefined;
    case MATCHERS.GREATER_THAN_OR_EQUAL_TO:
    case MATCHERS.LESS_THAN_OR_EQUAL_TO:
    case MATCHERS.BETWEEN:
      return dataType === 'DATETIME' ? zeroSinceSS : undefined;
    case MATCHERS.IN_SPLIT_TREATMENT:
      return dependencyProcessor;
    default:
      return undefined;
  }
}

function sanitizeValue(matcherTypeID: number, value: any, dataType: string, attributes?: Object): any {
  const processor = getProcessingFunction(matcherTypeID, dataType);
  let sanitizedValue;

  switch (dataType) {
    case DATA_TYPES.NUMBER:
    case DATA_TYPES.DATETIME:
      sanitizedValue = sanitizeNumber(value);
      break;
    case DATA_TYPES.STRING:
      sanitizedValue = sanitizeString(value);
      break;
    case DATA_TYPES.SET:
      sanitizedValue = sanitizeArray(value);
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

module.exports = sanitizeValue;
