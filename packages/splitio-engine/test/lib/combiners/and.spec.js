'use strict';

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

var tape = require('tape');
var andCombinerFactory = require('../../../lib/combiners/and');

tape('AND COMBINER / should correctly propagate context parameters and predicates returns value', function (assert) {
  var inputKey = 'sample';
  var inputSeed = 1234;
  var evaluationResult = 'treatment';

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

tape('AND COMBINER / should stop evaluating when one matcher return a treatment', function (assert) {
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

  assert.equal(andCombinerEvaluator(), 'exclude', 'exclude treatment found');
  assert.equal(called, 2, '2 predicates should be called');
  assert.end();
});

tape('AND COMBINER / none matching rule', function (assert) {
  var predicates = [function undef() {
    return undefined;
  }, function undef() {
    return undefined;
  }, function undef() {
    return undefined;
  }];

  assert.equal(andCombinerFactory(predicates)(), undefined, 'should return undefined when not matching found');
  assert.end();
});
//# sourceMappingURL=and.spec.js.map