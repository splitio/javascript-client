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
import { types as matcherTypes } from '../../matchers/types';
import matcherFactory from '../../matchers';

tape('MATCHER LESS THAN OR EQUAL / should return true ONLY when the value is less than or equal to 10', function (assert) {

  let matcher = matcherFactory({
    negate: false,
    type: matcherTypes.LESS_THAN_OR_EQUAL_TO,
    value: 10
  });

  assert.true(matcher(10),         '10 <= 10');
  assert.true(matcher(9),          '9 <= 10');
  assert.false(matcher(11),        '11 ! <= 10');
  assert.end();

});