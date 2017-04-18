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

const log = require('debug')('splitio-engine:sanitize');

const isArray = require('lodash/isArray');
const uniq = require('lodash/uniq');
const toString = require('lodash/toString');
const toNumber = require('lodash/toNumber');

const matcherTypes = require('../matchers/types').enum;

const INPUT_DATA_TYPES = {
  STRING: 'string',
  NUMBER: 'number',
  SET: 'array',
  NOT_SPECIFIED: 'not_specified'
};

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

function getExpectedType(matcherTypeID: number): string {
  switch (matcherTypeID) {
    case matcherTypes.EQUAL_TO:
    case matcherTypes.GREATER_THAN_OR_EQUAL_TO:
    case matcherTypes.LESS_THAN_OR_EQUAL_TO:
    case matcherTypes.BETWEEN:
      return INPUT_DATA_TYPES.NUMBER;

    case matcherTypes.EQUAL_TO_SET:
    case matcherTypes.CONTAINS_ANY_OF_SET:
    case matcherTypes.CONTAINS_ALL_OF_SET:
    case matcherTypes.PART_OF_SET:
      return INPUT_DATA_TYPES.SET;

    case matcherTypes.ALL:
    case matcherTypes.WHITELIST:
    case matcherTypes.SEGMENT:
    case matcherTypes.ENDS_WITH:
    case matcherTypes.STARTS_WITH:
    case matcherTypes.CONTAINS_STRING:
      return INPUT_DATA_TYPES.STRING;

    default:
      return INPUT_DATA_TYPES.NOT_SPECIFIED;
  }
}

function sanitizeValue(matcherTypeID: number, value: any, process?: Function): any {
  const expectedType = getExpectedType(matcherTypeID);
  let sanitizedValue;

  switch (expectedType) {
    case INPUT_DATA_TYPES.NUMBER:
      sanitizedValue = sanitizeNumber(value);
      break;
    case INPUT_DATA_TYPES.STRING:
      sanitizedValue = sanitizeString(value);
      break;
    case INPUT_DATA_TYPES.SET:
      sanitizedValue = sanitizeArray(value);
      break;
    default:
      sanitizedValue = undefined;
  }

  if (process) {
    sanitizedValue = process(sanitizedValue);
  }

  log('Attempted to sanitize [%s] which should be of type [%s]. \n Sanitized value => [%s]', value, expectedType, sanitizedValue);

  return sanitizedValue;
}

module.exports = sanitizeValue;
