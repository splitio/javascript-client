'use strict';

let tape = require('tape');
let collectorFactory = require('../../../lib/collector/sequential');

tape('SEQUENTIAL COLLECTOR / should incrementally store values', assert => {
  let c = collectorFactory();

  c.track(0);
  c.track(1);
  c.track(2);

  assert.true(
    c.counters().reduce((accum, e, k) => accum += e - k, 0) === 0,
    'all the items should be stored in sequential order'
  );
  assert.end();
});

tape('SEQUENTIAL COLLECTOR / should support custom toJSON method', assert => {
  let c = collectorFactory();
  let hooked = JSON.stringify(c);
  let manual = JSON.stringify(c.counters());

  assert.true(hooked === manual, 'toJSON should expose the counters as an array of numbers');
  assert.end();
});
