/* eslint-disable no-fallthrough */
import { UTF16ToUTF8 } from './common';

/*!
 * +----------------------------------------------------------------------------------+
 * | murmurHash3.js v3.0.0 (http://github.com/karanlyons/murmurHash3.js)              |
 * | A TypeScript/JavaScript implementation of MurmurHash3's hashing algorithms.      |
 * |----------------------------------------------------------------------------------|
 * | Copyright (c) 2012-2020 Karan Lyons. Freely distributable under the MIT license. |
 * +----------------------------------------------------------------------------------+
 */

// PRIVATE FUNCTIONS
// -----------------
function _x64Add(m, n) {
  //
  // Given two 64bit ints (as an array of two 32bit ints) returns the two
  // added together as a 64bit int (as an array of two 32bit ints).
  //

  m = [m[0] >>> 16, m[0] & 0xffff, m[1] >>> 16, m[1] & 0xffff];
  n = [n[0] >>> 16, n[0] & 0xffff, n[1] >>> 16, n[1] & 0xffff];
  var o = [0, 0, 0, 0];

  o[3] += m[3] + n[3];
  o[2] += o[3] >>> 16;
  o[3] &= 0xffff;

  o[2] += m[2] + n[2];
  o[1] += o[2] >>> 16;
  o[2] &= 0xffff;

  o[1] += m[1] + n[1];
  o[0] += o[1] >>> 16;
  o[1] &= 0xffff;

  o[0] += m[0] + n[0];
  o[0] &= 0xffff;

  return [(o[0] << 16) | o[1], (o[2] << 16) | o[3]];
}

function _x64Multiply(m, n) {
  //
  // Given two 64bit ints (as an array of two 32bit ints) returns the two
  // multiplied together as a 64bit int (as an array of two 32bit ints).
  //

  m = [m[0] >>> 16, m[0] & 0xffff, m[1] >>> 16, m[1] & 0xffff];
  n = [n[0] >>> 16, n[0] & 0xffff, n[1] >>> 16, n[1] & 0xffff];
  var o = [0, 0, 0, 0];

  o[3] += m[3] * n[3];
  o[2] += o[3] >>> 16;
  o[3] &= 0xffff;

  o[2] += m[2] * n[3];
  o[1] += o[2] >>> 16;
  o[2] &= 0xffff;

  o[2] += m[3] * n[2];
  o[1] += o[2] >>> 16;
  o[2] &= 0xffff;

  o[1] += m[1] * n[3];
  o[0] += o[1] >>> 16;
  o[1] &= 0xffff;

  o[1] += m[2] * n[2];
  o[0] += o[1] >>> 16;
  o[1] &= 0xffff;

  o[1] += m[3] * n[1];
  o[0] += o[1] >>> 16;
  o[1] &= 0xffff;

  o[0] += (m[0] * n[3]) + (m[1] * n[2]) + (m[2] * n[1]) + (m[3] * n[0]);
  o[0] &= 0xffff;

  return [(o[0] << 16) | o[1], (o[2] << 16) | o[3]];
}

function _x64Rotl(m, n) {
  //
  // Given a 64bit int (as an array of two 32bit ints) and an int
  // representing a number of bit positions, returns the 64bit int (as an
  // array of two 32bit ints) rotated left by that number of positions.
  //

  n %= 64;

  if (n === 32) {
    return [m[1], m[0]];
  } else if (n < 32) {
    return [(m[0] << n) | (m[1] >>> (32 - n)), (m[1] << n) | (m[0] >>> (32 - n))];
  } else {
    n -= 32;
    return [(m[1] << n) | (m[0] >>> (32 - n)), (m[0] << n) | (m[1] >>> (32 - n))];
  }
}

function _x64LeftShift(m, n) {
  //
  // Given a 64bit int (as an array of two 32bit ints) and an int
  // representing a number of bit positions, returns the 64bit int (as an
  // array of two 32bit ints) shifted left by that number of positions.
  //

  n %= 64;

  if (n === 0) {
    return m;
  } else if (n < 32) {
    return [(m[0] << n) | (m[1] >>> (32 - n)), m[1] << n];
  } else {
    return [m[1] << (n - 32), 0];
  }
}

function _x64Xor(m, n) {
  //
  // Given two 64bit ints (as an array of two 32bit ints) returns the two
  // xored together as a 64bit int (as an array of two 32bit ints).
  //

  return [m[0] ^ n[0], m[1] ^ n[1]];
}

function _x64Fmix(h) {
  //
  // Given a block, returns murmurHash3's final x64 mix of that block.
  // (`[0, h[0] >>> 1]` is a 33 bit unsigned right shift. This is the
  // only place where we need to right shift 64bit ints.)
  //

  h = _x64Xor(h, [0, h[0] >>> 1]);
  h = _x64Multiply(h, [0xff51afd7, 0xed558ccd]);
  h = _x64Xor(h, [0, h[0] >>> 1]);
  h = _x64Multiply(h, [0xc4ceb9fe, 0x1a85ec53]);
  h = _x64Xor(h, [0, h[0] >>> 1]);

  return h;
}

// PUBLIC FUNCTIONS
// ----------------
function hash128x64(key /*: string */, seed /*: number */) /*: string */ {
  //
  // Given a string and an optional seed as an int, returns a 128 bit
  // hash using the x64 flavor of MurmurHash3, as an unsigned hex.
  //

  key = key || '';
  seed = seed || 0;

  var remainder = key.length % 16;
  var bytes = key.length - remainder;

  var h1 = [0, seed];
  var h2 = [0, seed];

  var k1 = [0, 0];
  var k2 = [0, 0];

  var c1 = [0x87c37b91, 0x114253d5];
  var c2 = [0x4cf5ad43, 0x2745937f];

  for (var i = 0; i < bytes; i = i + 16) {
    k1 = [((key.charCodeAt(i + 4) & 0xff)) | ((key.charCodeAt(i + 5) & 0xff) << 8) | ((key.charCodeAt(i + 6) & 0xff) << 16) | ((key.charCodeAt(i + 7) & 0xff) << 24), ((key.charCodeAt(i) & 0xff)) | ((key.charCodeAt(i + 1) &
      0xff) << 8) | ((key.charCodeAt(i + 2) & 0xff) << 16) | ((key.charCodeAt(i + 3) & 0xff) << 24)];
    k2 = [((key.charCodeAt(i + 12) & 0xff)) | ((key.charCodeAt(i + 13) & 0xff) << 8) | ((key.charCodeAt(i + 14) & 0xff) << 16) | ((key.charCodeAt(i + 15) & 0xff) << 24), ((key.charCodeAt(i + 8) & 0xff)) | ((key.charCodeAt(i +
      9) & 0xff) << 8) | ((key.charCodeAt(i + 10) & 0xff) << 16) | ((key.charCodeAt(i + 11) & 0xff) << 24)];

    k1 = _x64Multiply(k1, c1);
    k1 = _x64Rotl(k1, 31);
    k1 = _x64Multiply(k1, c2);
    h1 = _x64Xor(h1, k1);

    h1 = _x64Rotl(h1, 27);
    h1 = _x64Add(h1, h2);
    h1 = _x64Add(_x64Multiply(h1, [0, 5]), [0, 0x52dce729]);

    k2 = _x64Multiply(k2, c2);
    k2 = _x64Rotl(k2, 33);
    k2 = _x64Multiply(k2, c1);
    h2 = _x64Xor(h2, k2);

    h2 = _x64Rotl(h2, 31);
    h2 = _x64Add(h2, h1);
    h2 = _x64Add(_x64Multiply(h2, [0, 5]), [0, 0x38495ab5]);
  }

  k1 = [0, 0];
  k2 = [0, 0];

  switch (remainder) {
    case 15:
      k2 = _x64Xor(k2, _x64LeftShift([0, key.charCodeAt(i + 14)], 48));

    case 14:
      k2 = _x64Xor(k2, _x64LeftShift([0, key.charCodeAt(i + 13)], 40));

    case 13:
      k2 = _x64Xor(k2, _x64LeftShift([0, key.charCodeAt(i + 12)], 32));

    case 12:
      k2 = _x64Xor(k2, _x64LeftShift([0, key.charCodeAt(i + 11)], 24));

    case 11:
      k2 = _x64Xor(k2, _x64LeftShift([0, key.charCodeAt(i + 10)], 16));

    case 10:
      k2 = _x64Xor(k2, _x64LeftShift([0, key.charCodeAt(i + 9)], 8));

    case 9:
      k2 = _x64Xor(k2, [0, key.charCodeAt(i + 8)]);
      k2 = _x64Multiply(k2, c2);
      k2 = _x64Rotl(k2, 33);
      k2 = _x64Multiply(k2, c1);
      h2 = _x64Xor(h2, k2);

    case 8:
      k1 = _x64Xor(k1, _x64LeftShift([0, key.charCodeAt(i + 7)], 56));

    case 7:
      k1 = _x64Xor(k1, _x64LeftShift([0, key.charCodeAt(i + 6)], 48));

    case 6:
      k1 = _x64Xor(k1, _x64LeftShift([0, key.charCodeAt(i + 5)], 40));

    case 5:
      k1 = _x64Xor(k1, _x64LeftShift([0, key.charCodeAt(i + 4)], 32));

    case 4:
      k1 = _x64Xor(k1, _x64LeftShift([0, key.charCodeAt(i + 3)], 24));

    case 3:
      k1 = _x64Xor(k1, _x64LeftShift([0, key.charCodeAt(i + 2)], 16));

    case 2:
      k1 = _x64Xor(k1, _x64LeftShift([0, key.charCodeAt(i + 1)], 8));

    case 1:
      k1 = _x64Xor(k1, [0, key.charCodeAt(i)]);
      k1 = _x64Multiply(k1, c1);
      k1 = _x64Rotl(k1, 31);
      k1 = _x64Multiply(k1, c2);
      h1 = _x64Xor(h1, k1);
  }

  h1 = _x64Xor(h1, [0, key.length]);
  h2 = _x64Xor(h2, [0, key.length]);

  h1 = _x64Add(h1, h2);
  h2 = _x64Add(h2, h1);

  h1 = _x64Fmix(h1);
  h2 = _x64Fmix(h2);

  h1 = _x64Add(h1, h2);
  h2 = _x64Add(h2, h1);

  return ('00000000' + (h1[0] >>> 0).toString(16)).slice(-8) + ('00000000' + (h1[1] >>> 0).toString(16)).slice(-8) + ('00000000' + (h2[0] >>> 0).toString(16)).slice(-8) + ('00000000' + (h2[1] >>> 0).toString(16)).slice(-8);
}

/**
 * x64 version of Murmur3 for 128bits.
 *
 * @param {string} str
 */
export function hash128(str /*: string */, seed /*: number */) /*: string */ {
  return hash128x64(UTF16ToUTF8(str), seed >>> 0);
}
