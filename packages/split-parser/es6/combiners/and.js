'use strict';

function andContext(predicates) {

  return function andCombinerEvaluator(key, seed) {
    for (let evaluator of predicates) {
      if (evaluator(key, seed)) return true;
    }

    return false;
  };

}

module.exports = andContext;
