/* @flow */ 'use strict';

let isOn = require('../engine').isOn;

/**
 * Evaluator factory.
 */
function evaluatorContext(martcherEvaluator /*: function */, partitionSet /*: Set */) /*: Function */ {

  return function evaluator(key /*: string */, seed /*: number */) /*: boolean */ {
    return martcherEvaluator(key) && isOn(key, seed, partitionSet);
  };

}

module.exports = evaluatorContext;
