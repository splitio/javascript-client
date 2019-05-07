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

import parser from '../../parser';
import keyParser from '../../../utils/key/parser';

tape('PARSER / if user.string is true then split 100%:on', async function (assert) {

  const evaluator = parser([{
    matcherGroup: {
      combiner: 'AND',
      matchers: [{
        keySelector: {
          trafficType: 'user',
          attribute: 'string'
        },
        matcherType: 'MATCHES_STRING',
        negate: false,
        stringMatcherData: '^hello'
      }]
    },
    partitions: [{
      treatment: 'on',
      size: 100
    }]
  }]);

  let evaluation = await evaluator(keyParser('testing'), 31, 100, 31, {
    string: 'ehllo dude'
  });
  assert.equal(evaluation, undefined);

  evaluation = await evaluator(keyParser('testing'), 31, 100, 31, {
    string: 'hello dude'
  });
  assert.equal(evaluation.treatment, 'on');

  assert.end();

});