'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var transform = require('../../../lib/transforms/partitions');
var partitionTypes = require('../../../lib/partitions/types');
var tape = require('tape');

/**
 * Assert if a given Array<Partition> is correctly mapped into a Map
 *
 * @param {array<{treatment: string, size: number}>} input
 * @param {tape} assert
 * @return void
 */
function checkTransform(input, assert) {
  var iterator = input[Symbol.iterator]();

  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = transform(input)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var _step$value = _slicedToArray(_step.value, 2);

      var key = _step$value[0];
      var value = _step$value[1];
      var _iterator$next$value = iterator.next().value;
      var treatment = _iterator$next$value.treatment;
      var size = _iterator$next$value.size;

      assert.equal(partitionTypes.type(treatment), key, treatment + ' is correct');
      assert.equal(size, value, size + ' is correct');
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
}

tape('Partition => 5%:on 95%:control', function (assert) {
  // example of 2 partitions distribution
  var five_percent_on = [{
    "treatment": "on",
    "size": 5
  }, {
    "treatment": "control",
    "size": 95
  }];

  checkTransform(five_percent_on, assert);

  assert.end();
});

tape('Partition => 100%:on', function (assert) {
  // example of 100% partition
  var hundred_percent_on = [{
    "treatment": "on",
    "size": 100
  }];

  checkTransform(hundred_percent_on, assert);

  assert.end();
});
//# sourceMappingURL=partitions.spec.js.map