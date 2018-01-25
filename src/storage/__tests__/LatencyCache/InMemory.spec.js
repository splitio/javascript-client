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
import tape from 'tape';
import LatencyCacheInMemory from '../../LatencyCache/InMemory';

tape('METRICS CACHE IN MEMORY / should count based on ranges', assert => {
  const metricName = 'testing';
  const c1 = new LatencyCacheInMemory();

  c1.track(metricName, 1)
    .track(metricName, 1.2)
    .track(metricName, 1.4);

  assert.true(c1.state()[metricName][0] === 3, 'the bucket #0 should have 3');

  c1.track(metricName, 1.5);
  assert.true(c1.state()[metricName][1] === 1, 'the bucket #1 should have 1');

  c1.track(metricName, 2.25)
    .track(metricName, 2.26)
    .track(metricName, 2.265);
  assert.true(c1.state()[metricName][2] === 3, 'the bucket #3 should have 1');

  c1.track(metricName, 985251);
  assert.true(c1.state()[metricName][22] === 1, 'the bucket #22 should have 1');

  assert.end();
});

tape('METRICS CACHE IN MEMORY / clear', assert => {
  const metricName = 'testing';
  const c1 = new LatencyCacheInMemory();

  c1.track(metricName, 1)
    .track(metricName, 1000);

  assert.true(c1.clear().isEmpty(), 'after call clear, the cache should be empty');

  assert.end();
});

tape('METRICS CACHE IN MEMORY / should support custom toJSON method', assert => {
  const c = new LatencyCacheInMemory();
  const hooked = JSON.stringify(c);
  const manual = JSON.stringify(c.state());

  assert.true(hooked === manual, 'toJSON should expose the counters as an array of numbers');
  assert.end();
});