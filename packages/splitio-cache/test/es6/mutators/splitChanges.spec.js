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
const MutatorFactory = require('../../../lib/mutators/splitChanges');
const splitChangesMock = require('./mocks/splitChanges');
const SplitsStorage = require('../../../lib/storage/splits');

tape('Split Changes', assert => {
  const splits = new SplitsStorage();

  const mutator = MutatorFactory(splitChangesMock);
  mutator({splits});

  for (const feature of ['sample_feature', 'demo_feature', 'hello_world']) {
    assert.true(splits.get(feature) !== undefined, 'split keys should match with split names');
  }
  assert.end();
});
