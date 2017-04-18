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

const tape = require('tape-catch');
const matcherTypes = require('../../matchers/types').enum;
const matcherFactory = require('../../matchers');

tape('MATCHER CONTAINS_STRING / should return true ONLY when the is contained in ["roni", "bad", "ar"]', function (assert) {

  let matcher = matcherFactory({
    negate: false,
    type: matcherTypes.CONTAINS_STRING,
    value: ['roni', 'bad', 'ar']
  });

  assert.true(matcher('pepperoni'), 'pepperoni contain ["roni", "bad", "ar"]');
  assert.true(matcher('badminton'), 'badminton contain ["roni", "bad", "ar"]');
  assert.true(matcher('market'), 'market contain ["roni", "bad", "ar"]');
  assert.false(matcher('violin'), 'violin does not contain ["roni", "bad", "ar"]');
  assert.false(matcher('manager'), 'manager does not contain ["roni", "bad", "ar"]');
  assert.end();

});

tape('MATCHER CONTAINS_STRING / negate should return false when the expected return value is true', function (assert) {

  let matcher = matcherFactory({
    negate: true,
    type: matcherTypes.CONTAINS_STRING,
    value: ['roni', 'bad', 'ar']
  });

  assert.false(matcher('pepperoni'), 'NOT pepperoni contain ["roni", "bad", "ar"]');
  assert.false(matcher('badminton'), 'NOT badminton contain ["roni", "bad", "ar"]');
  assert.false(matcher('market'), 'NOT market contain ["roni", "bad", "ar"]');
  assert.true(matcher('violin'), 'NOT violin does not contain ["roni", "bad", "ar"]');
  assert.true(matcher('manager'), 'NOT manager does not contain ["roni", "bad", "ar"]');
  assert.end();
});
