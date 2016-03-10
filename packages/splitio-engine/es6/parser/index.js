const matcherGroupTransform = require('../transforms/matcherGroup');
const treatmentsParser = require('../treatments').parse;

const matcherTypes = require('../matchers/types').enum;
const matcherFactory = require('../matchers');

const evaluatorFactory = require('../evaluator');

const andCombiner = require('../combiners/and');

/*::
  type ParserOutputDTO = {
    segments: Set,
    evaluator: (key: string, seed: number) => boolean
  }
*/

// Collect segments and create the evaluator function given a list of
// conditions. This code is the base used by the class `Split` for
// instanciation.
function parse(conditions /*: Iterable<Object> */, storage /*: Storage */) /*: ParserOutputDTO */ {
  let predicates = [];
  let segments = new Set();
  let evaluator = null;

  for (let condition of conditions) {
    let matcherMetadata = matcherGroupTransform(condition.matcherGroup);
    let matcherEvaluator = matcherFactory(matcherMetadata, storage);
    let treatments = treatmentsParser(condition.partitions);

    // Incrementally collect segmentNames
    if (matcherMetadata.type === matcherTypes.SEGMENT) {
      segments.add(matcherMetadata.value);
    }

    predicates.push(evaluatorFactory(matcherEvaluator, treatments));
  }

  // Instanciate evaluator given the set of conditions
  evaluator = andCombiner(predicates);

  return {
    segments,
    evaluator
  };
}

module.exports = parse;
