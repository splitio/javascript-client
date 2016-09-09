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
const matcherTypes = require('../../matchers/types').enum;
const matcherFactory = require('../../matchers');

tape('MATCHER BETWEEN / should return true ONLY when the value is between 10 and 20', function (assert) {

  let matcher = matcherFactory({
    negate: false,
    type: matcherTypes.BETWEEN,
    value: {
      dataType: 'NUMBER',
      start: 10,
      end: 20
    }
  });

  assert.false(matcher(9),         '9 is not between 10 and 20');
  assert.true(matcher(10),         '10 is between 10 and 20');
  assert.true(matcher(15),         '15 is between 10 and 20');
  assert.true(matcher(20),         '20 is between 10 and 20');
  assert.false(matcher(21),        '21 is not between 10 and 20');
  assert.false(matcher(undefined), 'undefined is not between 10 and 20');
  assert.false(matcher(null),      'null is not between 10 and 20');
  assert.end();

});

tape('MATCHER BETWEEN / negate should return false when the expected return value is true', function (assert) {

  let matcher = matcherFactory({
    negate: true,
    type: matcherTypes.BETWEEN,
    value: {
      dataType: 'NUMBER',
      start: 10,
      end: 20
    }
  });

  assert.true(matcher(9),         '! 9 is not between 10 and 20');
  assert.false(matcher(10),       '! 10 is between 10 and 20');
  assert.false(matcher(15),       '! 15 is between 10 and 20');
  assert.false(matcher(20),       '! 20 is between 10 and 20');
  assert.true(matcher(21),        '! 21 is not between 10 and 20');
  assert.true(matcher(undefined), '! undefined is not between 10 and 20');
  assert.true(matcher(null),      '! null is not between 10 and 20');
  assert.end();

});
