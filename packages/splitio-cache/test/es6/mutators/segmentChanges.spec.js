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
let segmentChangesMutatorFactory = require('../../../lib/mutators/segmentChanges');

tape('Segment Changes', assert => {
  let segmentChanges = {
    name: 'test-segment',
    added: ['a', 'b', 'c'],
    removed: ['d', 'e', 'f']
  };

  let segmentsStorage = new Map().set('test-segment', new Set(['d', 'e', 'f']));
  function storageMutator(segmentName, segmentSet) {
    segmentsStorage.set(segmentName, segmentSet);
  }
  function storageAccesor(segmentName) {
    return segmentsStorage.get(segmentName);
  }

  let mutator = segmentChangesMutatorFactory([segmentChanges]);
  mutator(storageAccesor, storageMutator);

  assert.deepEqual(
    [...storageAccesor('test-segment')],
    segmentChanges.added,
    'We should only have [a, b, c]'
  );
  assert.end();
});
