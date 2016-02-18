'use strict';

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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

  assert.deepEqual([].concat((0, _toConsumableArray3.default)(segmentsStorage)), segments, 'once mutator called data should be the same as the originally provided');
  assert.end();
});
//# sourceMappingURL=mySegments.spec.js.map