const engine = require('../engine');

/**
 * Evaluator factory.
 */
function evaluatorContext(matcherEvaluator /*: function */, treatments /*: Treatments */) /*: Function */ {

  return function evaluator(key /*: string */, seed /*: number */) /*:? string */ {

    // if the matcherEvaluator return true, then evaluate the treatment
    if (matcherEvaluator(key)) {
      return engine.getTreatment(key, seed, treatments);
    }

    // else we should notify the engine to continue evaluating
    return undefined;

  };

}

module.exports = evaluatorContext;
