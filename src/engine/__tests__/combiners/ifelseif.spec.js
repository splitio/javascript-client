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
'use strict';

const tape = require('tape');
const ifElseIfCombinerFactory = require('../../combiners/ifelseif');

tape('IF ELSE IF COMBINER / should correctly propagate context parameters and predicates returns value', assert => {
  let inputKey = 'sample';
  let inputSeed = 1234;
  let inputAttributes = {};
  let evaluationResult = 'treatment';

  function evaluator(key, seed, attributes) {
    assert.true(key === inputKey, 'key should be equals');
    assert.true(seed === inputSeed, 'seed should be equals');
    assert.true(attributes === inputAttributes, 'attributes should be equals');

    return evaluationResult;
  }

  let predicates = [evaluator];
  let ifElseIfEvaluator = ifElseIfCombinerFactory(predicates);

  assert.true(
    ifElseIfEvaluator(inputKey, inputSeed, inputAttributes) === evaluationResult,
    `evaluator should return ${evaluationResult}`
  );
  assert.end();
});

tape('IF ELSE IF COMBINER / should stop evaluating when one matcher return a treatment', assert => {
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

  let ifElseIfEvaluator = ifElseIfCombinerFactory(predicates);

  assert.equal(
    ifElseIfEvaluator(), 'exclude', 'exclude treatment found'
  );
  assert.equal(called, 2, '2 predicates should be called');
  assert.end();
});

tape('IF ELSE IF COMBINER / should return undefined if there is none matching rule', assert => {
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

  assert.true(ifElseIfCombinerFactory(predicates)() === undefined);
  assert.end();
});
