'use strict';

var _isFinite = require('babel-runtime/core-js/number/is-finite');

var _isFinite2 = _interopRequireDefault(_isFinite);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var tape = require('tape');
var now = require('../../../lib/now');

tape('NOW / should generate a value each time you call it', function (assert) {

  var n1 = now();
  var n2 = now();
  var n3 = now();

  assert.true((0, _isFinite2.default)(n1), 'is a finite value?');
  assert.true((0, _isFinite2.default)(n2), 'is a finite value?');
  assert.true((0, _isFinite2.default)(n3), 'is a finite value?');
  assert.end();
});
//# sourceMappingURL=index.spec.js.map