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

const ava = require('ava');
const collectorFactory = require('../../collector/single');

ava('SINGLE COLLECTOR / should implement a secuencia counter', assert => {
  let c = collectorFactory();

  c.track(); c.track(); c.track();

  assert.true(c.state() === 3, 'counter should be 3');
  assert.end();
});

ava('SINGLE COLLECTOR / should start from 0 after clear call', assert => {
  let c = collectorFactory();

  c.track(); c.track(); c.track(); c.clear();

  assert.true(c.state() === 0, 'counter is 0');
  assert.end();
});

ava('SINGLE COLLECTOR / should support custom toJSON method', assert => {
  let c = collectorFactory();
  let hooked = JSON.stringify(c);
  let manual = JSON.stringify(c.state());

  assert.true(hooked === manual, 'toJSON should expose the counters as an array of numbers');
  assert.end();
});
