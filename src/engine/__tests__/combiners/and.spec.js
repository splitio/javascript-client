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
const andCombiner = require('../../combiners/and');

tape('COMBINER AND / should always return true', function (assert) {

  let AND = andCombiner([() => true, () => true, () => true]);

  assert.true(AND('always true'), 'should always return true');
  assert.end();

});

tape('COMBINER AND / should always return false', function (assert) {

  let AND = andCombiner([() => true, () => true, () => false]);

  assert.false(AND('always false'), 'should always return false');
  assert.end();
});
