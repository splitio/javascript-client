'use strict';

let tape = require('tape');
let scheduler = require('../../../lib/scheduler')();

tape('Scheduler', assert => {
  let counter = 0;
  let lastCounter = 0;
  function task() { counter++; }

  scheduler.forever(task, 15); // fire the task around 15ms + task time

  setTimeout(function() {
    scheduler.kill(); // stop forever scheduling

    lastCounter = counter;
    assert.true(counter >= 2, 'at least 2 calls should be completed (magic number)');

    setTimeout(function() {
      assert.true(counter === lastCounter, 'the calls should stop');
      assert.end();
    }, 50);
  }, 50);
});
