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
import tape from 'tape-catch';
import engine from '../../engine';
import Treatments from '../../treatments';
const treatmentsMock = Treatments.parse([{
  treatment: 'on',
  size: 5
}, {
  treatment: 'off',
  size: 95
}]);

tape('ENGINE / should evaluate always evaluate to false', assert => {
  let seed = 467569525;
  let bucketingKey = 'aUfEsdPN1twuEjff9Sl';

  let startTime = Date.now();

  assert.true(
    engine.getTreatment(bucketingKey, seed, treatmentsMock) === 'off',
    "treatment should be 'off'"
  );

  let endTime = Date.now();

  assert.comment(`Evaluation takes ${(endTime - startTime) / 1000} seconds`);
  assert.end();
});

tape('ENGINE / should evaluate always evaluate to true', assert => {
  let seed = 467569525;
  let bucketingKey = 'fXvNwWFb7SXp';

  let startTime = Date.now();

  assert.true(
    engine.getTreatment(bucketingKey, seed, treatmentsMock) === 'on',
    "treatment should be 'on'"
  );

  let endTime = Date.now();

  assert.comment(`Evaluation takes ${(endTime - startTime) / 1000} seconds`);
  assert.end();
});

tape('ENGINE / shouldApplyRollout - trafficAllocation 100', assert => {

  const shouldApplyRollout = engine.shouldApplyRollout(100, 'asd', 14, 2);

  assert.ok(shouldApplyRollout, 'Should return true as traffic allocation is 100.');
  assert.end();
});

tape('ENGINE / shouldApplyRollout - algo 1 (legacy) | trafficAllocation 80 | bucket 79', assert => {

  const shouldApplyRollout = engine.shouldApplyRollout(80, 'aaab', 31, 1);

  assert.ok(shouldApplyRollout, 'Should return true as traffic allocation is 100.');
  assert.end();
});

tape('ENGINE / shouldApplyRollout - algo 1 (legacy) | trafficAllocation 80 | bucket 82', assert => {

  const shouldApplyRollout = engine.shouldApplyRollout(80, 'aaab', 32, 1);

  assert.notOk(shouldApplyRollout, 'Should return false as bucket is higher than trafficAllocation.');
  assert.end();
});

tape('ENGINE / shouldApplyRollout - algo 2 (murmur) | trafficAllocation 53 | bucket 51', assert => {

  const shouldApplyRollout = engine.shouldApplyRollout(53, 'a', 29, 2);

  assert.ok(shouldApplyRollout, 'Should return true as traffic allocation is 100.');
  assert.end();
});

tape('ENGINE / shouldApplyRollout - algo 2 (murmur) | trafficAllocation 53 | bucket 56', assert => {

  const shouldApplyRollout = engine.shouldApplyRollout(53, 'a', 31, 2);

  assert.notOk(shouldApplyRollout, 'Should return false as bucket is higher than trafficAllocation.');
  assert.end();
});