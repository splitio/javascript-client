'use strict';

const NUMBER_OF_KEYS = 10;
const KEY_LENGTH = 10;

var crypto = require('crypto');
var collection = new Array(NUMBER_OF_KEYS);

for (let i = 0; i < NUMBER_OF_KEYS; i++) {
  collection[i] = crypto.randomBytes(KEY_LENGTH).toString('hex');
}

console.log(JSON.stringify(collection, null, 2));
