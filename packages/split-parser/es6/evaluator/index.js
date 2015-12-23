'use strict';

var engine = require('split-engine');

/**
 * @return boolean
 */
function evaluator(martcherEvaluator, partitionSet) {

  return function (key, seed) {
    return martcherEvaluator(key) && engine.isOn(key, seed, partitionSet);
  };

}

module.export = evaluator;
