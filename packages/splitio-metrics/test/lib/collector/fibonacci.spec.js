'use strict';

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var tape = require('tape');
var collectorFactory = require('../../../lib/collector/fibonacci');

tape('FIBONACCI COLLECTOR / should count based on ranges', function (assert) {
  var c1 = collectorFactory();

  c1.track(1);
  c1.track(1.2);
  c1.track(1.4);
  assert.true(c1.counters()[0] === 3, 'the bucket #0 should have 3');

  c1.track(1.5);
  assert.true(c1.counters()[1] === 1, 'the bucket #1 should have 1');

  c1.track(2.25);
  c1.track(2.26);
  c1.track(2.265);
  assert.true(c1.counters()[2] === 3, 'the bucket #3 should have 1');

  c1.track(985251);
  assert.true(c1.counters()[22] === 1, 'the bucket #22 should have 1');

  assert.end();
});

tape('FIBONACCI COLLECTOR / should count based on ranges', function (assert) {
  var c1 = collectorFactory();

  c1.track(1);
  c1.track(1000);
  c1.track(1001);
  c1.track(1500);
  c1.track(3456);
  c1.track(985251);
  c1.track(985271);
  c1.track(7481830);

  assert.true(c1.clear().counters().reduce(function (sum, c) {
    return sum += c;
  }, 0) === 0, 'after call clear, counters should be 0');

  assert.end();
});

tape('FIBONACCI COLLECTOR / should support custom toJSON method', function (assert) {
  var c = collectorFactory();
  var hooked = (0, _stringify2.default)(c);
  var manual = (0, _stringify2.default)(c.counters());

  assert.true(hooked === manual, 'toJSON should expose the counters as an array of numbers');
  assert.end();
});
//# sourceMappingURL=fibonacci.spec.js.map