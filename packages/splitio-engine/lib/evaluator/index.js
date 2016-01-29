/* @flow */'use strict';

var engine = require('../engine');

/**
 * Evaluator factory.
 */
function evaluatorContext(martcherEvaluator /*: function */, treatments /*: Treatments */) /*: Function */{

  return function evaluator(key /*: string */, seed /*: number */) /*: boolean */{
    return martcherEvaluator(key) && engine.isOn(key, seed, treatments);
  };
}

module.exports = evaluatorContext;
//# sourceMappingURL=index.js.map