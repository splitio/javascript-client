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
import fs from 'fs';
import rl from 'readline';

[
  'regex.txt'
].forEach(filename => {

  tape('MATCHER REGEX / validate regex behavior using sample data', assert => {
    const parser = rl.createInterface({
      terminal: false,
      input: fs.createReadStream(require.resolve(`../mocks/${filename}`))
    });

    parser
      .on('line', line => {
        const parts = line.toString('utf8').split('#');

        if (parts.length === 3) {
          let [regex, input, test] = parts;

          test = test === 'true';

          const matcher = matcherFactory({
            type: matcherTypes.MATCHES_STRING,
            value: regex
          });

          assert.true(matcher(input) === test);
        }
      })
      .on('close', assert.end);
  });

});
