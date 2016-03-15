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
const bs = require('../../../lib/binarySearch');

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

tape('BINARY SEARCH / run test using integer keys', assert => {
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

tape('BINARY SEARCH / run test using float keys', assert => {
  const KEYS = [
    1, 1.5, 2.25, 3.38, 5.06, 7.59, 11.39, 17.09, 25.63, 38.44,
    57.67, 86.5, 129.75, 194.62, 291.93, 437.89, 656.84, 985.26, 1477.89,
    2216.84, 3325.26, 4987.89, 77481.83
  ];

  let searchFor = bs.bind(null, KEYS);

  let index = searchFor(3.38);
  assert.true(index === 3, `expected value 3, returned ${index}`);

  index = searchFor(6);
  assert.true(index === 4, `expected value 4, returned ${index}`);

  index = searchFor(500.55);
  assert.true(index === 15, `expected value 15, returned ${index}`);

  index = searchFor(77481.83);
  assert.true(index === 22, `expected value 22, returned ${index}`);

  index = searchFor(80000);
  assert.true(index === 22, `expected value 22, returned ${index}`);

  assert.end();
});
