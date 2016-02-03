'use strict';

let tape = require('tape');
let andCombinerFactory = require('../../../lib/combiners/and');

tape('AND combiner', assert => {
  let inputKey = 'sample';
  let inputSeed = 1234;
  let evaluationResult = true;

  function evaluator(key, seed) {
    assert.true(key === inputKey, 'key should be equals');
    assert.true(seed === inputSeed, 'seed should be equals');

    return evaluationResult;
  }

  let predicates = [evaluator];
  let andCombinerEvaluator = andCombinerFactory(predicates);

  assert.true(
    andCombinerEvaluator(inputKey, inputSeed) === evaluationResult,
    `evaluator should return ${evaluationResult}`
  );
  assert.end();
});
