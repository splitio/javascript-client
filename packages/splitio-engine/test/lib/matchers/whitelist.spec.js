'use strict';

var _set = require('babel-runtime/core-js/set');

var _set2 = _interopRequireDefault(_set);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var matcherTypes = require('../../../lib/matchers/types');
var matcherFactory = require('../../../lib/matchers');
var tape = require('tape');

tape('MATCHER WHITELIST / should return true ONLY when the key is defined', function (assert) {

  var matcher = matcherFactory({
    type: matcherTypes.enum.WHITELIST,
    value: new _set2.default().add('key')
  });

  assert.true(matcher('key'), '"key" should be true');
  assert.false(matcher('another key'), '"another key" should be false');
  assert.end();
});
//# sourceMappingURL=whitelist.spec.js.map