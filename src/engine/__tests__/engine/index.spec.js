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
const engine = require('../../engine');

const Treatments = require('../../treatments');
const treatmentsMock = Treatments.parse([{
  treatment: 'on',
  size: 5
}, {
  treatment: 'off',
  size: 95
}]);

tape('ENGINE / should evaluate always evaluate to false', assert => {
  let seed = 467569525;
  let key = 'aUfEsdPN1twuEjff9Sl';

  let startTime = Date.now();

  assert.true(
    engine.getTreatment(key, seed, treatmentsMock) === 'off',
    "treatment should be 'off'"
  );

  let endTime = Date.now();

  assert.comment(`Evaluation takes ${(endTime - startTime) / 1000} seconds`);
  assert.end();
});

tape('ENGINE / should evaluate always evaluate to true', assert => {
  let seed = 467569525;
  let key = 'fXvNwWFb7SXp';

  let startTime = Date.now();

  assert.true(
    engine.getTreatment(key, seed, treatmentsMock) === 'on',
    "treatment should be 'on'"
  );

  let endTime = Date.now();

  assert.comment(`Evaluation takes ${(endTime - startTime) / 1000} seconds`);
  assert.end();
});
