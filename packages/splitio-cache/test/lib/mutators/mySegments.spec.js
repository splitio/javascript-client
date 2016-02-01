'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var tape = require('tape');
var mySegmentsMutatorFactory = require('../../../lib/mutators/mySegments');

tape('Segment mutator', function (assert) {

  var segments = ['segment1', 'segment2'];

  var segmentsStorage = undefined;
  function storageMutator(segmentSet) {
    segmentsStorage = segmentSet;
  }

  var mutator = mySegmentsMutatorFactory(segments);
  mutator(storageMutator);

  assert.deepEqual([].concat(_toConsumableArray(segmentsStorage)), segments, 'once mutator called data should be the same as the originally provided');
  assert.end();
});
//# sourceMappingURL=mySegments.spec.js.map