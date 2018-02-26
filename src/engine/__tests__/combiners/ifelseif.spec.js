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
import tape from 'tape-catch';
import ifElseIfCombinerFactory from '../../combiners/ifelseif';

tape('IF ELSE IF COMBINER / should correctly propagate context parameters and predicates returns value', async function (assert) {
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
    await ifElseIfEvaluator(inputKey, inputSeed, inputAttributes) === evaluationResult,
    `evaluator should return ${evaluationResult}`
  );
  assert.end();
});

tape('IF ELSE IF COMBINER / should stop evaluating when one matcher return a treatment', async function(assert) {
  let predicates = [
    function undef() {
      return undefined;
    },
    function exclude() {
      return 'exclude';
    },
    function alwaysTrue() {
      return 'alwaysTrue';
    }
  ];

  let ifElseIfEvaluator = ifElseIfCombinerFactory(predicates);

  assert.equal(
    await ifElseIfEvaluator(), 'exclude', 'exclude treatment found'
  );
  assert.end();
});

tape('IF ELSE IF COMBINER / should return undefined if there is none matching rule', async function (assert) {
  const predicates = [
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

  const ifElseIfEvaluator = ifElseIfCombinerFactory(predicates);

  assert.true(await ifElseIfEvaluator() === undefined);
  assert.end();
});