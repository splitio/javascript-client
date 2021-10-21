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
import { matcherTypes } from '../../../matchers/types';
import matcherFactory from '../../../matchers';

tape('MATCHER REGEX / should match the attribute value only with the string starts with hello', function (assert) {

  const matcher = matcherFactory({
    type: matcherTypes.MATCHES_STRING,
    value: '^hello'
  });

  assert.false(matcher('abc'));
  assert.true(matcher('hello dude!'));
  assert.end();

});

tape('MATCHER REGEX / incorrectly matches unicode characters', function (assert) {

  const matcher = matcherFactory({
    type: matcherTypes.MATCHES_STRING,
    value: 'a.b'
  });

  assert.false(matcher('aXXb'));
  assert.false(matcher('a𝌆b'));
  assert.end();

});
