'use strict';

const tape = require('tape');
const andCombinerFactory = require('../../../lib/combiners/and');

tape('AND COMBINER / should correctly propagate context parameters and predicates returns value', assert => {
  let inputKey = 'sample';
  let inputSeed = 1234;
  let evaluationResult = 'treatment';

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

tape('AND COMBINER / should stop evaluating when one matcher return a treatment', assert => {
  let called = 0;
  let predicates = [
    function undef() {
      called++;
      return undefined;
    },
    function exclude() {
      called++;
      return 'exclude';
    },
    function alwaysTrue() {
      called++;
      return 'alwaysTrue';
    }
  ];

  let andCombinerEvaluator = andCombinerFactory(predicates);

  assert.true(andCombinerEvaluator() === 'exclude', 'The combiner should STOP at the first predicates which returns a treatment');
  assert.true(called === 2, 'Just 2 predicates should be called in this test');
  assert.end();
});

tape('AND COMBINER / should return undefined if there is none matching rule', assert => {
  let predicates = [
    function undef() {
      return undefined;
    },
    function undef() {
      return undefined;
    },
    function undef() {
      return undefined;
    }
  ];

  assert.true(andCombinerFactory(predicates)() === undefined);
  assert.end();
});
