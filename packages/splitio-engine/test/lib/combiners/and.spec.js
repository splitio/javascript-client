'use strict';

var tape = require('tape');
var andCombinerFactory = require('../../../lib/combiners/and');

tape('AND combiner', function (assert) {
  var inputKey = 'sample';
  var inputSeed = 1234;
  var evaluationResult = true;

  function evaluator(key, seed) {
    assert.true(key === inputKey, 'key should be equals');
    assert.true(seed === inputSeed, 'seed should be equals');

    return evaluationResult;
  }

  var predicates = [evaluator];
  var andCombinerEvaluator = andCombinerFactory(predicates);

  assert.true(andCombinerEvaluator(inputKey, inputSeed) === evaluationResult, 'evaluator should return ' + evaluationResult);
  assert.end();
});
//# sourceMappingURL=and.spec.js.map