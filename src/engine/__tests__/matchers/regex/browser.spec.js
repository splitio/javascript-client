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
import 'isomorphic-unfetch';
import tape from 'tape-catch';
import { types as matcherTypes } from '../../../matchers/types';
import matcherFactory from '../../../matchers';

tape('MATCHER REGEX / validate regex behavior using sample data', assert => {
  fetch('/base/engine/__tests__/matchers/mocks/regex.txt')
    .then(response => response.text())
    .then(text => {
      const lines = text.trim().split(/\r\n|\n|\r/);

      assert.plan(lines.length);

      for(let parts of lines) {
        setTimeout(() => {
          let [regex, input, test] = parts.split('#');

          test = test === 'true';

          const matcher = matcherFactory({
            type: matcherTypes.MATCHES_STRING,
            value: regex
          });

          assert.true(matcher(input) === test);
        }, Math.random() * 100);
      }
    })
    .catch(error => assert.error(error));

});
