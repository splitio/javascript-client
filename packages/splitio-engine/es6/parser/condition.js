/* @flow */ 'use strict';

let matcherGroupTransform = require('../transforms/matcherGroup');
let treatmentsParser = require('../treatments').parse;

let matcherTypes = require('../matchers/types').enum;
let matcherFactory = require('../matchers');

let evaluatorFactory = require('../evaluator');

let andCombiner = require('../combiners/and');

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
