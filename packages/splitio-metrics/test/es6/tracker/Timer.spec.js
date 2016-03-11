'use strict';

let tape = require('tape');
let TimerFactory = require('../../../lib/tracker/Timer');
let CollectorFactory = require('../../../lib/collector/Sequential');

tape('TRACKER / calling start() and stop() should store and entry inside the collector', assert => {
  let collector = CollectorFactory();
  let start = TimerFactory(collector);
  let stop = start();

  setTimeout(function() {
    let et = stop();

    assert.true(collector.state().indexOf(et) !== -1, 'ET should be present in the collector sequence');
    assert.end();
  }, 5);
});
