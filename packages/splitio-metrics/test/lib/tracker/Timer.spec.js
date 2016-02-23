'use strict';

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var tape = require('tape');
var TimerFactory = require('../../../lib/tracker/Timer');
var CollectorFactory = require('../../../lib/collector/Sequential');

tape('TRACKER / calling start() and stop() should store and entry inside the collector', function (assert) {
  var collector = CollectorFactory();
  var start = TimerFactory(collector);
  var stop = start();

  setTimeout(function () {
    var et = stop();

    console.log((0, _stringify2.default)(collector.state()));

    assert.true(collector.state().indexOf(et) !== -1, 'ET should be present in the collector sequence');
    assert.end();
  }, 5);
});
//# sourceMappingURL=Timer.spec.js.map