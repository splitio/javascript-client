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

const tape = require('tape-catch');
const TimerFactory = require('../Timer');
const PassThroughFactory = require('../PassThrough');

tape('TIMER / calling start() and stop() should store and entry inside the collector', assert => {
  let tracked;
  const start = TimerFactory({
    track(v) {
      tracked = v;
    }
  });
  const stop = start();

  setTimeout(function () {
    const et = stop();

    assert.true(tracked === et, 'ET should be present in the collector sequence');
    assert.end();
  }, 5);
});

tape('PASS / transparently propagate the value into the collector', assert => {
  let tracked;

  const track = PassThroughFactory({
    track(v) {
      tracked = v;
    }
  });

  track(10);

  assert.true(tracked === 10, 'ET should be present in the collector sequence');
  assert.end();
});
