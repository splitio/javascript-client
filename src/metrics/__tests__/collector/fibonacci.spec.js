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

let tape = require('tape');
let collectorFactory = require('../../collector/fibonacci');

tape('FIBONACCI COLLECTOR / should count based on ranges', assert => {
  let c1 = collectorFactory();

  c1.track(1);
  c1.track(1.2);
  c1.track(1.4);
  assert.true(c1.state()[0] === 3, 'the bucket #0 should have 3');

  c1.track(1.5);
  assert.true(c1.state()[1] === 1, 'the bucket #1 should have 1');

  c1.track(2.25);
  c1.track(2.26);
  c1.track(2.265);
  assert.true(c1.state()[2] === 3, 'the bucket #3 should have 1');

  c1.track(985251);
  assert.true(c1.state()[22] === 1, 'the bucket #22 should have 1');

  assert.end();
});

tape('FIBONACCI COLLECTOR / should count based on ranges', assert => {
  let c1 = collectorFactory();

  c1.track(1);
  c1.track(1000);
  c1.track(1001);
  c1.track(1500);
  c1.track(3456);
  c1.track(985251);
  c1.track(985271);
  c1.track(7481830);

  assert.true(
    c1.clear().state().reduce((sum, c) => sum += c, 0) === 0,
    'after call clear, counters should be 0'
  );

  assert.end();
});

tape('FIBONACCI COLLECTOR / should support custom toJSON method', assert => {
  let c = collectorFactory();
  let hooked = JSON.stringify(c);
  let manual = JSON.stringify(c.state());

  assert.true(hooked === manual, 'toJSON should expose the counters as an array of numbers');
  assert.end();
});
