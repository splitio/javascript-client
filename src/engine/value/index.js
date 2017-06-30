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

const log = require('../../utils/logger')('splitio-engine:value');
const sanitizeValue = require('./sanitize');

function parseValue(key: string, attributeName: string, attributes: Object) {
  let value = undefined;
  if (attributeName) {
    if (attributes) {
      value = attributes[attributeName];
      log.debug(`Extracted attribute [${attributeName}], [${value}] will be used for matching`);
    } else {
      log.warn(`Defined attribute [${attributeName}], no attributes received`);
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
  const sanitizedValue = sanitizeValue(matcherDto.type, valueToMatch, matcherDto.dataType, attributes);

  if (sanitizedValue !== undefined) {
    return sanitizedValue;
  } else {
    log.warn(`Value ${valueToMatch} ${attributeName ? `for attribute ${attributeName} ` : + ''}doesn\'t match with expected type`);
    return;
  }
}

module.exports = value;
