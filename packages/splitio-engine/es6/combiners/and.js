'use strict';

function andContext(predicates /*: Array<function> */) {

  return function andCombinerEvaluator(key /*: string */, seed /*: number */) {
    for (let evaluator of predicates) {
      if (evaluator(key, seed)) return true;
    }

    return false;
  };

}

module.exports = andContext;
