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

const tape = require('tape');

const matcherTypes = require('../../../matchers/types');
const matcherFactory = require('../../../matchers');

tape('MATCHER SEGMENT / should return true ONLY when the segment is defined inside the segment storage', assert => {
  const segment = 'employees';

  const matcher = matcherFactory({
    type: matcherTypes.enum.SEGMENT,
    value: segment
  }, {
    segments: {
      has(segmentName) {
        if (segmentName !== segment) {
          throw Error('Unexpected segment name');
        }

        return segment === segmentName;
      }
    }
  });

  assert.true(matcher(), 'segment found in mySegments list');
  assert.end();
});
