'use strict';

let tape = require('tape');
let collectorFactory = require('../../../lib/collector/single');

tape('SINGLE COLLECTOR / should implement a secuencia counter', assert => {
  let c = collectorFactory();

  c.track(); c.track(); c.track();

  assert.true(c.counters() === 3, 'counter should be 3');
  assert.end();
});

tape('SINGLE COLLECTOR / should start from 0 after clear call', assert => {
  let c = collectorFactory();

  c.track(); c.track(); c.track(); c.clear();

  assert.true(c.counters() === 0, 'counter is 0');
  assert.end();
});

tape('SINGLE COLLECTOR / should support custom toJSON method', assert => {
  let c = collectorFactory();
  let hooked = JSON.stringify(c);
  let manual = JSON.stringify(c.counters());

  assert.true(hooked === manual, 'toJSON should expose the counters as an array of numbers');
  assert.end();
});
