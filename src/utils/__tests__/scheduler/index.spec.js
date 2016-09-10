/**
Copyright 2016 Split Software

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
**/
'use strict';

const tape = require('tape');
const scheduler = require('../../scheduler')();

tape('SCHEDULER / once we kill the scheduler, the task should not be called again', assert => {
  let counter = 0;
  let lastCounter = 0;
  function task() {
    counter++;
  }

  scheduler.forever(task, 0.1); // fire the task around 0.1s + task time

  setTimeout(function () {
    scheduler.kill(); // stop forever scheduling

    lastCounter = counter;
    assert.true(counter >= 1, 'at least 1 call should be completed');

    setTimeout(function () {
      assert.true(counter === lastCounter, 'the calls should stop');
      assert.end();
    }, 200);
  }, 200);
});

tape('SCHEDULER / multiple calls to kill should not throw an error', assert => {
  let counter = 0;
  function task() {
    counter++;
  }

  scheduler.forever(task, 0.1); // fire the task around 0.1s + task time
  scheduler.kill();
  scheduler.kill();
  scheduler.forever(task, 0.1);
  scheduler.kill();

  assert.true(counter === 2, 'task should be called 2 times');
  assert.end();
});
