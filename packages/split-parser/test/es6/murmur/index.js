'use strict';

var murmur = require('murmurhash-js');
var tape = require('tape');

var datasets = [
  require('./mocks/1000_keys_of_length_10'),
  require('./mocks/10000_keys_of_length_10'),
  require('./mocks/100000_keys_of_length_10')
];

function engine(key, seed) {
  return murmur(key, seed) % 100;
}

function stats(keys) {
  let numberOfBuckets = 100;
  let universeSize = keys.length;
  let collisionCounter = new Map();
  let probabilityDistribution = new Map();

  // translate values to bucket and accumulate collisions
  for (let k of keys) {
    let bucket = engine(k, 424344136);

    collisionCounter.set(bucket, (collisionCounter.get(bucket) || 0) + 1);
  }

  // calculate probability of each bucket
  for (let [bucket, collisions] of collisionCounter) {
    probabilityDistribution.set(bucket, collisions / universeSize);
  }

  // @TODO Test around 0.01

  //
  // We expect always # keys / 100 buckets will be equal, so we distribute elements
  // using that expectation (validated before with the 0.01 test).
  //
  // Given it's an experiment were it's in the bucket, or not, we could analyse the
  // problem as follow:
  //
  // - Each bucket will have N = 1000 keys (assuming a universe of 100000 keys )
  // - The probability P of success is 0.01
  // - The probability Q of failure is 0.99
  //

  let n = universeSize / numberOfBuckets;
  let p = 0.01;
  let q = (1 - p);

  let mean = n * p;
  let sd = Math.sqrt( n * p * q );

  //  for (let [b, p] of p) {
  //    mean += b * p;
  //  }
  //
  //  for (let [b, p] of p) {
  //    sd += p * Math.pow(b - mean, 2);
  //  }
  //  sd = Math.sqrt(sd);

  console.log('================================================================');
  console.log(`Mean for ${keys.length} keys of length 10: ${mean.toFixed(2)}`);
  console.log(`SD for ${keys.length} keys of length 10: ${sd.toFixed(2)}`);
  console.log('==> Rule 68-95-99.7');
  console.log(`68.27% will be between ${mean - sd} and ${mean + sd}`);
  console.log(`95.45% will be between ${mean - 2*sd} and ${mean + 2*sd}`);
  console.log(`99.73% will be between ${mean - 3*sd} and ${mean + 3*sd}`);
}

datasets.forEach( stats );
