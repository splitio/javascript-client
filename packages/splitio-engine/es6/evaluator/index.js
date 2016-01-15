'use strict';

var isOn = require('../engine').isOn;

/**
 * Factory function which creates a evaluator function to be called.
 *
 * @param {Function} martcherEvaluator - Given a key evaluates the segment/whitelist
 * @param {Set} partitionSet           - Set describing partitions of a given condition to be evaluated.
 *
 * @return {Function} evaluator function
 */
function evaluatorContext(martcherEvaluator /*: function */, partitionSet /*: Set */) {

  return function evaluator(key /*: string */, seed /*: number */) {
    return martcherEvaluator(key) && isOn(key, seed, partitionSet);
  };

}

module.exports = evaluatorContext;
