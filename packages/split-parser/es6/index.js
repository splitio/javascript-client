'use strict';

var matcherGroupTransform = require('./transforms/matcherGroup');
var partitionsTransform = require('./transforms/partitions');

var matcherFactory = require('./matchers');

var evaluator = require('./evaluator');

var andCombiner = require('./combiners/and');

/**
 * Evaluate the AST and provide a simple function to evaluate keys.
 *
 * @params {Array} input Collection of conditions present in a given Split.
 * @return {Function} helper Verifier if a given Key applies to a Split.
 */
function parse(input) {
  let predicates = [];

  for (let condition of input) {
    let matcherEvaluator = matcherFactory(
      matcherGroupTransform(condition.matcherGroup)
    );

    let partitions = partitionsTransform(condition.partitions);

    predicates.push(
      evaluator(matcherEvaluator, partitions)
    );
  }

  return andCombiner(predicates);
}

module.exports = parse;
