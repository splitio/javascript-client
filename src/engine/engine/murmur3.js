const utfx = require('utfx');

const stringSource = utfx.stringSource;
const stringDestination = utfx.stringDestination;
const encodeUTF16toUTF8 = utfx.encodeUTF16toUTF8;

function UTF16ToUTF8(key) {
  let sd;

  encodeUTF16toUTF8(
      stringSource(key),
      sd = stringDestination()
  );

  return sd();
}

// +----------------------------------------------------------------------+
// | murmurHash3.js v2.1.2 (http://github.com/karanlyons/murmurHash.js)   |
// | A javascript implementation of MurmurHash3's x86 hashing algorithms. |
// |----------------------------------------------------------------------|
// | Copyright (c) 2012 Karan Lyons                                       |
// | Freely distributable under the MIT license.                          |
// +----------------------------------------------------------------------+

// PRIVATE FUNCTIONS
// -----------------
function _x86Multiply(m, n) {
  //
  // Given two 32bit ints, returns the two multiplied together as a
  // 32bit int.
  //

  return ((m & 0xffff) * n) + ((((m >>> 16) * n) & 0xffff) << 16);
}


function _x86Rotl(m, n) {
  //
  // Given a 32bit int and an int representing a number of bit positions,
  // returns the 32bit int rotated left by that number of positions.
  //

  return (m << n) | (m >>> (32 - n));
}

function _x86Fmix(h) {
  //
  // Given a block, returns murmurHash3's final x86 mix of that block.
  //

  h ^= h >>> 16;
  h  = _x86Multiply(h, 0x85ebca6b);
  h ^= h >>> 13;
  h  = _x86Multiply(h, 0xc2b2ae35);
  h ^= h >>> 16;

  return h;
}

// PUBLIC FUNCTIONS
// ----------------
function hash32(key, seed) {
  //
  // Given a string and an optional seed as an int, returns a 32 bit hash
  // using the x86 flavor of MurmurHash3, as an unsigned int.
  //

  key = key || '';
  seed = seed || 0;

  var remainder = key.length % 4;
  var bytes = key.length - remainder;

  var h1 = seed;

  var k1 = 0;

  var c1 = 0xcc9e2d51;
  var c2 = 0x1b873593;

  for (var i = 0; i < bytes; i = i + 4) {
    k1 = ((key.charCodeAt(i) & 0xff)) | ((key.charCodeAt(i + 1) & 0xff) << 8) | ((key.charCodeAt(i + 2) & 0xff) << 16) | ((key.charCodeAt(i + 3) & 0xff) << 24);

    k1 = _x86Multiply(k1, c1);
    k1 = _x86Rotl(k1, 15);
    k1 = _x86Multiply(k1, c2);

    h1 ^= k1;
    h1 = _x86Rotl(h1, 13);
    h1 = _x86Multiply(h1, 5) + 0xe6546b64;
  }

  k1 = 0;

  switch (remainder) {
    case 3:
      k1 ^= (key.charCodeAt(i + 2) & 0xff) << 16;

    case 2:
      k1 ^= (key.charCodeAt(i + 1) & 0xff) << 8;

    case 1:
      k1 ^= (key.charCodeAt(i) & 0xff);
      k1 = _x86Multiply(k1, c1);
      k1 = _x86Rotl(k1, 15);
      k1 = _x86Multiply(k1, c2);
      h1 ^= k1;
  }

  h1 ^= key.length;
  h1 = _x86Fmix(h1);

  return h1 >>> 0;
}

function hash(str /*: string */, seed /*: number */) /*: number */ {
  return hash32(UTF16ToUTF8(str), seed >>> 0);
}

function bucket(str /*: string */, seed /*: number */) /*: number */ {
  return Math.abs(hash(str, seed) % 100) + 1;
}

module.exports = {
  hash,
  bucket
};
