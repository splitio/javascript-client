'use strict';

var murmur = require('murmurhash-js');
var tape = require('tape');

var datasets = [
//  require('./mocks/10_keys_of_length_10'),
//  require('./mocks/100_keys_of_length_10'),
//  require('./mocks/1000_keys_of_length_10'),
//  require('./mocks/10000_keys_of_length_10'),
  require('./mocks/100000_keys_of_length_10')
];

function engine(key, seed) {
  return murmur(key, seed) % 100;
}

function stats(keys) {
  let collisionCounter = new Map();
  let p = new Map();
  let mean = 0;
  let sd = 0;

  // translate values to bucket and accumulate collisions
  for (let k of keys) {
    let b = engine(k, 424344136);

    collisionCounter.set(b, (collisionCounter.get(b) || 0) + 1);
  }

  // calculate probability of each bucket
  for (let [b, c] of collisionCounter) {
    p.set(b, c / keys.length);

    //@TODO Test around 0.01
  }

  for (let [b, p] of p) {
    mean += b * p;
  }

  for (let [b, p] of p) {
    sd += p * Math.pow(b - mean, 2);
  }
  sd = Math.sqrt(sd);

  console.log('================================================================');
  console.log(`Mean for ${keys.length} keys of length 10: ${mean.toFixed(2)}`);
  console.log(`SD for ${keys.length} keys of length 10: ${sd.toFixed(2)}`);
  console.log('==> Rule 68-95-99.7');
  console.log(`68.27% will be between ${mean - sd} and ${mean + sd}`);
  console.log(`95.45% will be between ${mean - 2*sd} and ${mean + 2*sd}`);
  console.log(`99.73% will be between ${mean - 3*sd} and ${mean + 3*sd}`);
}

datasets.forEach( stats );
