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

const log = require('debug')('splitio-engine:value');
const sanitizeValue = require('./sanitize');

function parseValue(key: string, attributeName: string, attributes: Object) {
  let value = undefined;
  if (attributeName) {
    if (attributes) {
      value = attributes[attributeName];
      log('Extracted attribute [%s], [%s] will be used for matching', attributeName, value);
    } else {
      log('Defined attribute [%s], no attributes received', attributeName);
    }
  } else {
    value = key;
  }

  return value;
}

/**
 * Defines value to be matched (key / attribute).
 */
function value(key: string, matcherDto: Object, attributes: Object): ?string {
  const attributeName = matcherDto.attribute;
  const valueToMatch = parseValue(key, attributeName, attributes);
  const sanitizedValue = sanitizeValue(matcherDto.type, valueToMatch, matcherDto.dataType);

  if (sanitizedValue !== undefined) {
    return sanitizedValue;
  } else {
    log('Value [%s]' + (attributeName ? ' for attribute [%s]' : + '') + ' doesn\'t match with expected type', valueToMatch, attributeName);
    return;
  }
}

module.exports = value;
