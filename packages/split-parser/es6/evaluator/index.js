'use strict';

var engine = require('split-engine');

/**
 * Factory function which creates a evaluator function to be called.
 *
 * @param {Function} martcherEvaluator - Given a key evaluates the segment/whitelist
 * @param {Set} partitionSet           - Set describing partitions of a given condition to be evaluated.
 *
 * @return {Function} evaluator function
 */
function evaluatorContext(martcherEvaluator, partitionSet) {

  return function evaluator(key, seed) {
    return martcherEvaluator(key) && engine.isOn(key, seed, partitionSet);
  };

}

module.exports = evaluatorContext;
