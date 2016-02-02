/* @flow */ 'use strict';

const TREATMENT = require('../treatments/reserved');
let engine = require('../engine');

/**
 * Evaluator factory.
 */
function evaluatorContext(martcherEvaluator /*: function */, treatments /*: Treatments */) /*: Function */ {

  return function evaluator(key /*: string */, seed /*: number */) /*: string */ {

    if (martcherEvaluator(key)) {
      return engine.getTreatment(key, seed, treatments);
    }

    return TREATMENT.CONTROL;

  };

}

module.exports = evaluatorContext;
