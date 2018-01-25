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

import tape from 'tape-catch';
import { types as matcherTypes } from '../../matchers/types';
import matcherFactory from '../../matchers';

tape('MATCHER STARTS_WITH / should return true ONLY when the value starts with ["a", "b", "c"]', function (assert) {

  let matcher = matcherFactory({
    negate: false,
    type: matcherTypes.STARTS_WITH,
    value: ['a', 'b', 'c']
  });

  assert.true(matcher('awesome'), 'awesome start with ["a", "b", "c"]');
  assert.true(matcher('black'), 'black start with ["a", "b", "c"]');
  assert.true(matcher('chello'), 'chello start with ["a", "b", "c"]');
  assert.false(matcher('violin'), 'violin doesn\'t start with ["a", "b", "c"]');
  assert.false(matcher('manager'), 'manager doesn\'t start with ["a", "b", "c"]');
  assert.end();

});
