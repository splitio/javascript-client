/* @flow */'use strict';

var TREATMENT = require('../treatments/reserved');
var engine = require('../engine');

/**
 * Evaluator factory.
 */
function evaluatorContext(martcherEvaluator /*: function */, treatments /*: Treatments */) /*: Function */{

  return function evaluator(key /*: string */, seed /*: number */) /*: string */{

    if (martcherEvaluator(key)) {
      return engine.getTreatment(key, seed, treatments);
    }

    return TREATMENT.CONTROL;
  };
}

module.exports = evaluatorContext;
//# sourceMappingURL=index.js.map