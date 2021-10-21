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
import { matcherTypes } from '../../matchers/types';
import matcherFactory from '../../matchers';

tape('MATCHER ENDS_WITH / should return true ONLY when the value ends with ["a", "b", "c"]', function (assert) {

  let matcher = matcherFactory({
    negate: false,
    type: matcherTypes.ENDS_WITH,
    value: ['a', 'b', 'c']
  });

  assert.true(matcher('america'), 'america end with ["a", "b", "c"]');
  assert.true(matcher('blob'), 'blob end with ["a", "b", "c"]');
  assert.true(matcher('zodiac'), 'zodiac end with ["a", "b", "c"]');
  assert.false(matcher('violin'), 'violin doesn\'t end with ["a", "b", "c"]');
  assert.false(matcher('manager'), 'manager doesn\'t end with ["a", "b", "c"]');
  assert.end();

});

tape('MATCHER ENDS_WITH / should return true ONLY when the value ends with ["demo.test.org"]', function (assert) {

  let matcher = matcherFactory({
    negate: false,
    type: matcherTypes.ENDS_WITH,
    value: ['demo.test.org']
  });

  assert.true(matcher('robert@demo.test.org'), 'robert@demo.test.org should match.');
  assert.false(matcher('robert@test.org'), 'robert@test.org should not match.');
  assert.end();

});