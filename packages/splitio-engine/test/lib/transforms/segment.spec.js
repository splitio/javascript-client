'use strict';

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

var transform = require('../../../lib/transforms/segment');
var tape = require('tape');

tape('TRANSFORMS / a segment object should be flatten to a string', function (assert) {
  var segmentName = 'employees';
  var sample = {
    segmentName: segmentName
  };

  var plainSegmentName = transform(sample);

  assert.equal(segmentName, plainSegmentName, 'extracted segmentName matches');
  assert.end();
});

tape('TRANSFORMS / if there is none segmentName entry, returns undefined', function (assert) {
  var sample = undefined;
  var undefinedSegmentName = transform(sample);

  assert.equal(undefinedSegmentName, undefined, 'expected to be undefined');
  assert.end();
});