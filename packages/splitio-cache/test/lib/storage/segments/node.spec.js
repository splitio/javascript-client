'use strict';

var _set = require('babel-runtime/core-js/set');

var _set2 = _interopRequireDefault(_set);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var tape = require('tape');
var SegmentsStorage = require('../../../../lib/storage/segments');

tape('SEGMENTS STORAGE', function (assert) {
  var storage = new SegmentsStorage();

  var segmentName = 's';
  var segmentSet = new _set2.default(['a', 'b', 'c']);

  storage.update(segmentName, segmentSet);

  assert.equal(storage.get(segmentName), segmentSet, 'should use the same instance');
  assert.end();
});
//# sourceMappingURL=node.spec.js.map