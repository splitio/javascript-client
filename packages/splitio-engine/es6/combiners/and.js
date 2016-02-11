/* @flow */ 'use strict';

const TREATMENT = require('../treatments/reserved');

// Premature evaluator (return as soon as something evaluates to true).
function andContext(predicates /*: Array<(key: string, seed: number) => boolean)> */) /*: Function */ {

  return function andCombinerEvaluator(key /*: string */, seed /*: number */) /*: string */ {
    for (let evaluator of predicates) {
      let treatment = evaluator(key, seed);

      if (treatment !== undefined) {
        return treatment;
      }
    }

    return TREATMENT.CONTROL;
  };

}

module.exports = andContext;
