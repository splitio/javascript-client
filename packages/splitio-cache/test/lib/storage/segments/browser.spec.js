'use strict';

var _set = require('babel-runtime/core-js/set');

var _set2 = _interopRequireDefault(_set);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var tape = require('tape');
var SegmentsStorage = require('../../../../lib/storage/segments');

tape('SEGMENTS STORAGE', function (assert) {
  var storage = new SegmentsStorage();
  var segments = new _set2.default(['a', 'b', 'c']);

  storage.update(segments);

  assert.true(storage.has('b'), 'b is present in the list of segment names');
  assert.false(storage.has('s'), 's is present in the list of segment names');
  assert.end();
});
//# sourceMappingURL=browser.spec.js.map