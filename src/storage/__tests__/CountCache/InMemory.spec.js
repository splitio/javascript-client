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
const tape = require('tape');
const CountCacheInMemory = require('../../CountCache/InMemory');

tape('COUNT CACHE IN MEMORY / should count metric names incrementatly', assert => {
  const cache = new CountCacheInMemory();

  cache.track('counted-metric-one');
  cache.track('counted-metric-one');
  cache.track('counted-metric-two');

  const state = cache.state();

  assert.equal(state['counted-metric-one'], 2);
  assert.equal(state['counted-metric-two'], 1);

  assert.end();
});

tape('COUNT CACHE IN MEMORY / should support custom toJSON method', assert => {
  const cache = new CountCacheInMemory();
  const hooked = JSON.stringify(cache);
  const manual = JSON.stringify(cache.state());

  assert.true(hooked === manual, 'toJSON should expose the counters as an array of numbers');
  assert.end();
});
