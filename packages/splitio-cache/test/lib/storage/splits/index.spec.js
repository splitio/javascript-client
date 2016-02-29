'use strict';

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _set = require('babel-runtime/core-js/set');

var _set2 = _interopRequireDefault(_set);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var tape = require('tape');
var SplitsStorage = require('../../../../lib/storage/splits');

var SplitFactory = require('@splitsoftware/splitio-engine').parse;

var s1 = SplitFactory(require('./mocks/01.split'));
var s2 = SplitFactory(require('./mocks/02.split'));
var s3 = SplitFactory(require('./mocks/03.split'));
var mergedSegments = new _set2.default([].concat((0, _toConsumableArray3.default)(s1.getSegments())), [].concat((0, _toConsumableArray3.default)(s2.getSegments())), [].concat((0, _toConsumableArray3.default)(s3.getSegments())));

tape('SPLITS STORAGE / should return a list of unique segment names', function (assert) {
  var storage = new SplitsStorage();

  storage.update([s1, s2, s3]);

  assert.deepEqual(storage.getSegments(), mergedSegments, 'should be the same segment names');
  assert.end();
});

tape('SPLITS STORAGE / get by split name', function (assert) {
  var storage = new SplitsStorage();

  storage.update([s1, s2, s3]);

  assert.equal(storage.get('sample_01'), s1, 'should be the same object');
  assert.equal(storage.get('sample_02'), s2, 'should be the same object');
  assert.equal(storage.get('sample_03'), s3, 'should be the same object');
  assert.end();
});
//# sourceMappingURL=index.spec.js.map