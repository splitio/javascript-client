/* @flow */ 'use strict';

/**
 * AND operator factory.
 */
function andContext(predicates /*: Array<(key: string, seed: number) => boolean)> */) /*: Function */ {

  return function andCombinerEvaluator(key /*: string */, seed /*: number */) /*: boolean */ {
    for (let evaluator of predicates) {
      if (evaluator(key, seed)) return true;
    }

    return false;
  };

}

module.exports = andContext;
