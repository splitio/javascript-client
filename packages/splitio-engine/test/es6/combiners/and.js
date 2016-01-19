'use strict';

var tape = require('tape');
var andCombinerFactory = require('splitio-engine/lib/combiners/and');

tape('', (assert) => {
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
