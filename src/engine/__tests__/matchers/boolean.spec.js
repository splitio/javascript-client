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

tape('MATCHER BOOLEAN / should return true ONLY when the value is true', function (assert) {

  const matcher = matcherFactory({
    type: matcherTypes.EQUAL_TO_BOOLEAN,
    value: true
  });

  assert.true(matcher(true));
  assert.false(matcher(false));
  assert.false(matcher('false'));
  assert.false(matcher('true'));
  assert.false(matcher(0));
  assert.false(matcher(1));
  assert.end();

});