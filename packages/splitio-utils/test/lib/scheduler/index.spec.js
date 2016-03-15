'use strict';

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

var tape = require('tape');
var scheduler = require('../../../lib/scheduler')();

tape('Scheduler', function (assert) {
  var counter = 0;
  var lastCounter = 0;
  function task() {
    counter++;
  }

  scheduler.forever(task, 15); // fire the task around 15ms + task time

  setTimeout(function () {
    scheduler.kill(); // stop forever scheduling

    lastCounter = counter;
    assert.true(counter >= 2, 'at least 2 calls should be completed (magic number)');

    setTimeout(function () {
      assert.true(counter === lastCounter, 'the calls should stop');
      assert.end();
    }, 50);
  }, 50);
});
//# sourceMappingURL=index.spec.js.map