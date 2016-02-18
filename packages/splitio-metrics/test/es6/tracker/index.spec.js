'use strict';

let tape = require('tape');
let trackerFactory = require('../../../lib/tracker');
let collectorFactory = require('../../../lib/collector/sequential');

tape('TRACKER / calling start() and stop() should store and entry inside the collector', assert => {
  let collector = collectorFactory();
  let start = trackerFactory(collector);
  let stop = start();

  setTimeout(function() {
    let et = stop();

    assert.true(collector.counters().indexOf(et) != -1, 'ET should be present in the collector sequence');
    assert.end();
  }, 5);
});
