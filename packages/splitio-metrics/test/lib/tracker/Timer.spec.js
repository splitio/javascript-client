'use strict';

var tape = require('tape');
var TimerFactory = require('../../../lib/tracker/Timer');
var CollectorFactory = require('../../../lib/collector/Sequential');

tape('TRACKER / calling start() and stop() should store and entry inside the collector', function (assert) {
  var collector = CollectorFactory();
  var start = TimerFactory(collector);
  var stop = start();

  setTimeout(function () {
    var et = stop();

    assert.true(collector.state().indexOf(et) !== -1, 'ET should be present in the collector sequence');
    assert.end();
  }, 5);
});
//# sourceMappingURL=Timer.spec.js.map