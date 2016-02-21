'use strict';

var tape = require('tape');
var trackerFactory = require('../../../lib/tracker');
var collectorFactory = require('../../../lib/collector/sequential');

tape('TRACKER / calling start() and stop() should store and entry inside the collector', function (assert) {
  var collector = collectorFactory();
  var start = trackerFactory(collector);
  var stop = start();

  setTimeout(function () {
    var et = stop();

    assert.true(collector.counters().indexOf(et) !== -1, 'ET should be present in the collector sequence');
    assert.end();
  }, 5);
});
//# sourceMappingURL=index.spec.js.map