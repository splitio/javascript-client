'use strict';

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
//# sourceMappingURL=segment.spec.js.map