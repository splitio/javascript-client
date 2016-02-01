'use strict';

let tape = require('tape');
let splitChangesMutatorFactory = require('../../../lib/mutators/splitChanges');
let splitChangesMock = require('./mocks/splitChanges');

tape('Split Changes', assert => {
  let splitsStorage = new Map();
  function storageMutator(splitsArray) {
    splitsArray.forEach(s => {
      splitsStorage.set(s.getKey(), s);
    });
  }

  let mutator = splitChangesMutatorFactory(splitChangesMock);
  let collectedSegments = mutator(storageMutator);

  assert.deepEqual(
    [...collectedSegments],
    ['employees'],
    'should collect only employees segment'
  );
  assert.deepEqual(
    [...splitsStorage.keys()],
    ['sample_feature', 'demo_feature', 'hello_world'],
    'split keys should match with split names'
  );
  assert.end();
});
