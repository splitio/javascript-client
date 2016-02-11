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

tape('AND combiner - stop evaluating when one matcher return a treatment', function (assert) {
  var called = 0;
  var predicates = [function undef() {
    called++;
    return undefined;
  }, function exclude() {
    called++;
    return 'exclude';
  }, function alwaysTrue() {
    called++;
    return 'alwaysTrue';
  }];

  var andCombinerEvaluator = andCombinerFactory(predicates);

  assert.true(andCombinerEvaluator() === 'exclude', 'The combiner should STOP at the first predicates which returns a treatment');
  assert.true(called === 2, 'Just 2 predicates should be called in this test');
  assert.end();
});
//# sourceMappingURL=and.spec.js.map