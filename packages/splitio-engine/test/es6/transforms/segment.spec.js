'use strict';

const transform = require('../../../lib/transforms/segment');
const tape = require('tape');

tape('TRANSFORMS / a segment object should be flatten to a string', function (assert) {
  const segmentName = 'employees';
  const sample = {
    segmentName
  };

  const plainSegmentName = transform(sample);

  assert.equal(segmentName, plainSegmentName, 'extracted segmentName matches');
  assert.end();
});

tape('TRANSFORMS / if there is none segmentName entry, returns undefined', function (assert) {
  const sample = undefined;
  const undefinedSegmentName = transform(sample);

  assert.equal(undefinedSegmentName, undefined, 'expected to be undefined');
  assert.end();
});
