'use strict';

var _set = require('babel-runtime/core-js/set');

var _set2 = _interopRequireDefault(_set);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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

var matcherTypes = require('../../../../lib/matchers/types');
var matcherFactory = require('../../../../lib/matchers');
var tape = require('tape');

tape('MATCHER SEGMENT / should return true ONLY when the key is defined inside the segment', function (assert) {
  var segment = 'employees';

  var matcher = matcherFactory({
    type: matcherTypes.enum.SEGMENT,
    value: segment
  }, {
    segments: {
      get: function get(segmentName) {
        if (segmentName !== segment) {
          throw Error('Unexpected segment name');
        }

        return new _set2.default(['key']);
      }
    }
  });

  assert.true(matcher('key'), '"key" should be true');
  assert.false(matcher('another_key'), '"another key" should be false');
  assert.end();
});