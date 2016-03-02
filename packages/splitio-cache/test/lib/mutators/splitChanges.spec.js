'use strict';

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _map = require('babel-runtime/core-js/map');

var _map2 = _interopRequireDefault(_map);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var tape = require('tape');
var splitChangesMutatorFactory = require('../../../lib/mutators/splitChanges');
var splitChangesMock = require('./mocks/splitChanges');

tape('Split Changes', function (assert) {
  var splitsStorage = new _map2.default();
  function storageMutator(splitsArray) {
    splitsArray.forEach(function (s) {
      splitsStorage.set(s.getKey(), s);
    });
  }

  var mutator = splitChangesMutatorFactory(splitChangesMock);
  mutator(splitsStorage, storageMutator);

  assert.deepEqual([].concat((0, _toConsumableArray3.default)(splitsStorage.keys())), ['sample_feature', 'demo_feature', 'hello_world'], 'split keys should match with split names');
  assert.end();
});
//# sourceMappingURL=splitChanges.spec.js.map