'use strict';

let transform = require('split-parser/src/transforms/whitelist');
let tape = require('tape');

tape('a whitelist Array should be casted into a Set', function (assert) {
  let sample = [
    'u1',
    'u2',
    'u3'
  ];

  let sampleSet = transform(sample);

  for(let item in sample) {
    if (sampleSet.has(item)) {
      assert.fail(`Missing item ${item}`);
    }
  }

  assert.ok(true, 'Everything looks fine');
  assert.end();
});
