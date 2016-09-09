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

const ava = require('ava');
const matcherTypes = require('../../matchers/types').enum;
const matcherFactory = require('../../matchers');

ava('MATCHER EQUAL / should return true ONLY when the value is equal to 10', function (assert) {

  let matcher = matcherFactory({
    negate: false,
    type: matcherTypes.EQUAL_TO,
    value: {
      dataType: 'NUMBER',
      value: 10
    }
  });

  assert.true(matcher(10),         '10 == 10');
  assert.false(matcher(11),        '10 != 11');
  assert.false(matcher(undefined), '10 != undefined');
  assert.false(matcher(null),      '10 != null');
  assert.end();

});

ava('MATCHER EQUAL / negate should return false when the expected return value is true', function (assert) {

  let matcher = matcherFactory({
    negate: true,
    type: matcherTypes.EQUAL_TO,
    value: {
      dataType: 'NUMBER',
      value: 10
    }
  });

  assert.false(matcher(10),       '! 10 == 10');
  assert.true(matcher(11),        '! 10 != 11');
  assert.true(matcher(undefined), '! 10 != undefined');
  assert.true(matcher(null),      '! 10 != null');
  assert.end();

});
