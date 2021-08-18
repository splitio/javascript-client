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
import fs from 'fs';
import rl from 'readline';
import utils from '../../../engine/murmur3/murmur3';
import { hash128 } from '../../../engine/murmur3/murmur3_128';
import { hash64 } from '../../../engine/murmur3/murmur3_64';

[
  'murmur3-sample-v4.csv',
  'murmur3-sample-v3.csv',
  'murmur3-sample-data-v2.csv',
  'murmur3-sample-data-non-alpha-numeric-v2.csv',
  'murmur3-sample-double-treatment-users.csv'
].forEach(filename => {

  tape('MURMUR3 32 / validate hashing behavior using sample data', assert => {
    const parser = rl.createInterface({
      terminal: false,
      input: fs.createReadStream(require.resolve(`../mocks/${filename}`))
    });

    parser
      .on('line', line => {
        const parts = line.toString('utf8').split(',');

        if (parts.length === 4) {
          let [seed, key, hash, bucket] = parts;

          seed = parseInt(seed, 10);
          hash = parseInt(hash, 10);
          bucket = parseInt(bucket, 10);

          assert.equal(utils.hash(key, seed), hash);
          assert.equal(utils.bucket(key, seed), bucket);
        }
      })
      .on('close', assert.end);
  });

});

function dec2hex(str) {
  let sum = [];
  const dec = str.toString().split('');
  const hex = [];
  while (dec.length) {
    let s = 1 * dec.shift();
    for (let i = 0; s || i < sum.length; i++) {
      s += (sum[i] || 0) * 10;
      sum[i] = s % 16;
      s = (s - sum[i]) / 16;
    }
  }
  while (sum.length) {
    hex.push(sum.pop().toString(16));
  }
  return hex.join('');
}

[
  'murmur3_64_uuids.csv',
].forEach(filename => {

  tape('MURMUR3 128 / validate hashing behavior using sample data', assert => {
    const parser = rl.createInterface({
      terminal: false,
      input: fs.createReadStream(require.resolve(`../mocks/${filename}`))
    });

    parser
      .on('line', line => {
        const parts = line.split(',');

        if (parts.length === 3) {
          let [key, seed, hash] = parts;

          seed = parseInt(seed, 10);
          const result = hash128(key, seed);

          assert.equal(result.substring(0, 16), dec2hex(hash).padStart(16, '0'));
        }
      })
      .on('close', assert.end);
  });
});

tape('MURMUR3 128 higher 64 bits as decimal number', assert => {

  [
    ['key1', { hex: '15d67461d2044fb3', dec: '1573573083296714675' }],
    ['key2', { hex: '75b93494ef690e31', dec: '8482869187405483569' }],
    ['key3', { hex: '6f76f1df6ac38fea', dec: '8031872927333060586' }],
    ['key4', { hex: '5ec727b58617b474', dec: '6829471020522910836' }],
    ['key5', { hex: 'b07087d10f0143b8', dec: '12713811080036565944' }],
    ['key6', { hex: 'ddcd11333e54c85c', dec: '15982449564394506332' }],
    ['', { hex: '0000000000000000', dec: '0' }],
  ].forEach(([key, hash]) => {
    assert.deepEqual(hash64(key), hash);
  });

  assert.end();
});
