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
