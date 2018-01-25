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
import { types as matcherTypes} from '../../matchers/types';
import matcherFactory from '../../matchers';

tape('MATCHER ALL / should always return true', function (assert) {

  let matcher = matcherFactory({
    type: matcherTypes.ALL,
    value: undefined
  });

  assert.true(matcher('somekey'), '"somekey" should be true');
  assert.true(matcher('another key'), '"another key" should be true');
  assert.end();

});
