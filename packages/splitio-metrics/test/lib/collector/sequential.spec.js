'use strict';

var tape = require('tape');
var collectorFactory = require('../../../lib/collector/sequential');

tape('SEQUENTIAL COLLECTOR / should incrementally store values', function (assert) {
  var c = collectorFactory();

  c.track(0);
  c.track(1);
  c.track(2);

  assert.true(c.counters().reduce(function (accum, e, k) {
    return accum += e - k;
  }, 0) === 0, 'all the items should be stored in sequential order');
  assert.end();
});

tape('SEQUENTIAL COLLECTOR / should support custom toJSON method', function (assert) {
  var c = collectorFactory();
  var hooked = JSON.stringify(c);
  var manual = JSON.stringify(c.counters());

  assert.true(hooked === manual, 'toJSON should expose the counters as an array of numbers');
  assert.end();
});
//# sourceMappingURL=sequential.spec.js.map