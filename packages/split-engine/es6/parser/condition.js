'use strict';

var matcherGroupTransform = require('../transforms/matcherGroup');
var partitionsTransform = require('../transforms/partitions');

var matcherTypes = require('../matchers/types').enum;
var matcherFactory = require('../matchers');

var evaluatorFactory = require('../evaluator');

var andCombiner = require('../combiners/and');

/**
 * Collect segmentNames and create the evaluator function given a list of
 * conditions.
 *
 * @params {Iterable} conditions Collection of conditions present in a given Split.
 * @return {Object} .segments and .evaluator based on the given set of conditions.
 */
function parse(conditions) {
  let predicates = [];
  let segments = new Set();
  let evaluator = null;

  for (let condition of conditions) {
    let matcherMetadata = matcherGroupTransform(condition.matcherGroup);
    let matcherEvaluator = matcherFactory(matcherMetadata);
    let partitions = partitionsTransform(condition.partitions);

    // Incrementally collect segmentNames
    if (matcherMetadata.type === matcherTypes.SEGMENT) {
      segments.add(matcherMetadata.value);
    }

    predicates.push(evaluatorFactory(matcherEvaluator, partitions));
  }

  // Instanciate evaluator given the set of conditions
  evaluator = andCombiner(predicates);

  return {
    segments,
    evaluator
  };
}

module.exports = parse;
