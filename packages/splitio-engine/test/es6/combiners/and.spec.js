/**
Copyright 2016 Split Software

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
**/

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
