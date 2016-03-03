'use strict';

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var tape = require('tape');

var SegmentsStorage = require('../../../lib/storage/segments/browser');
var MySegmentsMutatorFactory = require('../../../lib/mutators/mySegments');

tape('Segment mutator', function (assert) {
  var segments = ['segment1', 'segment2'];
  var storage = new SegmentsStorage();
  var mutator = MySegmentsMutatorFactory(segments);

  mutator(storage.update.bind(storage));

  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = (0, _getIterator3.default)(segments), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var segmentName = _step.value;

      assert.true(storage.has(segmentName), 'segment should be present in the storage');
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  assert.end();
});
//# sourceMappingURL=mySegments.spec.js.map