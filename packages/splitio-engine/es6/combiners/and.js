
// Premature evaluator (return as soon as something evaluates to true).
function andContext(predicates /*: Array<(key: string, seed: number) => ?string)> */) /*: Function */ {

  return function andCombinerEvaluator(key /*: string */, seed /*: number */) /*: string */ {
    for (let evaluator of predicates) {
      let treatment = evaluator(key, seed);

      if (treatment !== undefined) {
        return treatment;
      }
    }

    return undefined;
  };

}

module.exports = andContext;
