'use strict';

let tape = require('tape');
let bs = require('../../../lib/utils/binarySearch');

tape('BINARY SEARCH / given [1,3,5,7,10] as dataset look for several elements', assert => {
  let searchFor = bs.bind(null, [1, 3, 5, 7, 10]);
  let index = undefined;
  let value = -1;

  index = searchFor(value);
  assert.true(index === 0, `expected value 0, returned ${index}`);

  value++; // 0
  index = searchFor(value);
  assert.true(index === 0, `expected value 0, returned ${index}`);

  value++; // 1
  index = searchFor(value);
  assert.true(index === 0, `expected value 0, returned ${index}`);

  value++; // 2
  index = searchFor(value);
  assert.true(index === 0, `expected value 0, returned ${index}`);

  value++; // 3
  index = searchFor(value);
  assert.true(index === 1, `expected value 1, returned ${index}`);

  value++; // 4
  index = searchFor(value);
  assert.true(index === 1, `expected value 1, returned ${index}`);

  value++; // 5
  index = searchFor(value);
  assert.true(index === 2, `expected value 2, returned ${index}`);

  value++; // 6
  index = searchFor(value);
  assert.true(index === 2, `expected value 2, returned ${index}`);

  value++; // 7
  index = searchFor(value);
  assert.true(index === 3, `expected value 3, returned ${index}`);

  value++; // 8
  index = searchFor(value);
  assert.true(index === 3, `expected value 3, returned ${index}`);

  value++; // 9
  index = searchFor(value);
  assert.true(index === 3, `expected value 3, returned ${index}`);

  value++; // 10
  index = searchFor(value);
  assert.true(index === 4, `expected value 4, returned ${index}`);

  value++; // 11
  index = searchFor(value);
  assert.true(index === 4, `expected value 4, returned ${index}`);

  value++; // 12
  index = searchFor(value);
  assert.true(index === 4, `expected value 4, returned ${index}`);

  assert.end();
});

tape('BINARY SEARCH / run test using system keys', assert => {
  const KEYS = [
    1000,    1500,    2250,   3375,    5063,
    7594,    11391,   17086,  25629,   38443,
    57665,   86498,   129746, 194620,  291929,
    437894,  656841,  985261, 1477892, 2216838,
    3325257, 4987885, 7481828
  ];

  let searchFor = bs.bind(null, KEYS);

  let index = searchFor(10);
  assert.true(index === 0, `expected value 0, returned ${index}`);

  index = searchFor(1001);
  assert.true(index === 0, `expected value 0, returned ${index}`);

  index = searchFor(1499);
  assert.true(index === 0, `expected value 0, returned ${index}`);

  index = searchFor(1500);
  assert.true(index === 1, `expected value 0, returned ${index}`);

  index = searchFor(2200);
  assert.true(index === 1, `expected value 0, returned ${index}`);

  index = searchFor(2251);
  assert.true(index === 2, `expected value 0, returned ${index}`);

  assert.end();
});
