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

const tape = require('tape');
const SegmentsStorage = require('../../../../lib/storage/segments');

tape('SEGMENTS STORAGE / has(string) should answer true / false if the elements if present or not', assert => {
  const storage = new SegmentsStorage;
  const segments = new Set(['a', 'b', 'c']);

  storage.update(segments);

  assert.true(storage.has('b'), 'b is present in the list of segment names');
  assert.false(storage.has('s'), 's is not present in the list of segment names');
  assert.end();
});

tape('SEGMENTS STORAGE / .size property should represent the amount of segments stored', assert => {
  const storage = new SegmentsStorage;
  const segment = new Set(['a', 'b', 'c', 'd', 'e']);

  storage.update(segment);

  assert.equal(storage.size, 5, 'we should have 5 keys stored in the current segment');
  assert.end();
});
