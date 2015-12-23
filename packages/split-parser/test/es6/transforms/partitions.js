'use strict';

let transform = require('split-parser/src/transforms/partitions');
let tape = require('tape');

/**
 * Assert if a given Array<Partition> is correctly mapped into a Map
 *
 * @param {array<{treatment: string, size: number}>} input
 * @param {tape} assert
 * @return void
 */
function checkTransform(input, assert) {
  let iterator = input[Symbol.iterator]();

  for(let [key, value] of transform(input)) {
    let {treatment, size} = iterator.next().value;

    assert.equal(treatment, key, `${treatment} is correct`);
    assert.equal(size, value, `${size} is correct`);
  }
}

tape('Partition => 5%:on 95%:control', function (assert) {
  // example of 2 partitions distribution
  let five_percent_on = [{
    "treatment": "on",
    "size": 5
  }, {
    "treatment": "control",
    "size": 95
  }];

  checkTransform(five_percent_on, assert);

  assert.end();
});

tape('Partition => 100%:on', function (assert) {
  // example of 100% partition
  let hundred_percent_on = [{
    "treatment": "on",
    "size": 100
  }];

  checkTransform(hundred_percent_on, assert);

  assert.end();
});
