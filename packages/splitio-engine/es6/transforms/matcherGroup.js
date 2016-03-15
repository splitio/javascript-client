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
const matcherTypes = require('../matchers/types');
const segmentTransform = require('./segment');
const whitelistTransform = require('./whitelist');

/*::
  type MatcherDTO = {
    type: Symbol,
    value: undefined | string | Array<string>
  }
*/

/**
 * Flat the complex matcherGroup structure into something handy.
 */
function transform(matcherGroup /*: object */) /*: MatcherDTO */ {
  let {
    matcherType,
    userDefinedSegmentMatcherData: segmentObject,
    whitelistMatcherData: whitelistObject
  } = matcherGroup.matchers[0];

  let type = matcherTypes.mapper(matcherType);
  let value;

  if (type === matcherTypes.enum.ALL) {
    value = undefined;
  } else if (type === matcherTypes.enum.SEGMENT) {
    value = segmentTransform(segmentObject);
  } else if (type === matcherTypes.enum.WHITELIST) {
    value = whitelistTransform(whitelistObject);
  }

  return {
    type,
    value
  };
}

module.exports = transform;
