/* eslint-disable no-fallthrough */
import { UTF16ToUTF8, x86Fmix, x86Multiply, x86Rotl } from './common';

/*!
 * +----------------------------------------------------------------------------------+
 * | murmurHash3.js v3.0.0 (http://github.com/karanlyons/murmurHash3.js)              |
 * | A TypeScript/JavaScript implementation of MurmurHash3's hashing algorithms.      |
 * |----------------------------------------------------------------------------------|
 * | Copyright (c) 2012-2020 Karan Lyons. Freely distributable under the MIT license. |
 * +----------------------------------------------------------------------------------+
 */

// PUBLIC FUNCTIONS
// ----------------
function hash128x86(key /*: string */, seed /*: number */) /*: string */ {
  //
  // Given a string and an optional seed as an int, returns a 128 bit
  // hash using the x86 flavor of MurmurHash3, as an unsigned hex.
  //

  key = key || '';
  seed = seed || 0;

  var remainder = key.length % 16;
  var bytes = key.length - remainder;

  var h1 = seed;
  var h2 = seed;
  var h3 = seed;
  var h4 = seed;

  var k1 = 0;
  var k2 = 0;
  var k3 = 0;
  var k4 = 0;

  var c1 = 0x239b961b;
  var c2 = 0xab0e9789;
  var c3 = 0x38b34ae5;
  var c4 = 0xa1e38b93;

  for (var i = 0; i < bytes; i = i + 16) {
    k1 = ((key.charCodeAt(i) & 0xff)) | ((key.charCodeAt(i + 1) & 0xff) << 8) | ((key.charCodeAt(i + 2) & 0xff) << 16) | ((key.charCodeAt(i + 3) & 0xff) << 24);
    k2 = ((key.charCodeAt(i + 4) & 0xff)) | ((key.charCodeAt(i + 5) & 0xff) << 8) | ((key.charCodeAt(i + 6) & 0xff) << 16) | ((key.charCodeAt(i + 7) & 0xff) << 24);
    k3 = ((key.charCodeAt(i + 8) & 0xff)) | ((key.charCodeAt(i + 9) & 0xff) << 8) | ((key.charCodeAt(i + 10) & 0xff) << 16) | ((key.charCodeAt(i + 11) & 0xff) << 24);
    k4 = ((key.charCodeAt(i + 12) & 0xff)) | ((key.charCodeAt(i + 13) & 0xff) << 8) | ((key.charCodeAt(i + 14) & 0xff) << 16) | ((key.charCodeAt(i + 15) & 0xff) << 24);

    k1 = x86Multiply(k1, c1);
    k1 = x86Rotl(k1, 15);
    k1 = x86Multiply(k1, c2);
    h1 ^= k1;

    h1 = x86Rotl(h1, 19);
    h1 += h2;
    h1 = x86Multiply(h1, 5) + 0x561ccd1b;

    k2 = x86Multiply(k2, c2);
    k2 = x86Rotl(k2, 16);
    k2 = x86Multiply(k2, c3);
    h2 ^= k2;

    h2 = x86Rotl(h2, 17);
    h2 += h3;
    h2 = x86Multiply(h2, 5) + 0x0bcaa747;

    k3 = x86Multiply(k3, c3);
    k3 = x86Rotl(k3, 17);
    k3 = x86Multiply(k3, c4);
    h3 ^= k3;

    h3 = x86Rotl(h3, 15);
    h3 += h4;
    h3 = x86Multiply(h3, 5) + 0x96cd1c35;

    k4 = x86Multiply(k4, c4);
    k4 = x86Rotl(k4, 18);
    k4 = x86Multiply(k4, c1);
    h4 ^= k4;

    h4 = x86Rotl(h4, 13);
    h4 += h1;
    h4 = x86Multiply(h4, 5) + 0x32ac3b17;
  }

  k1 = 0;
  k2 = 0;
  k3 = 0;
  k4 = 0;

  switch (remainder) {
    case 15:
      k4 ^= key.charCodeAt(i + 14) << 16;

    case 14:
      k4 ^= key.charCodeAt(i + 13) << 8;

    case 13:
      k4 ^= key.charCodeAt(i + 12);
      k4 = x86Multiply(k4, c4);
      k4 = x86Rotl(k4, 18);
      k4 = x86Multiply(k4, c1);
      h4 ^= k4;

    case 12:
      k3 ^= key.charCodeAt(i + 11) << 24;

    case 11:
      k3 ^= key.charCodeAt(i + 10) << 16;

    case 10:
      k3 ^= key.charCodeAt(i + 9) << 8;

    case 9:
      k3 ^= key.charCodeAt(i + 8);
      k3 = x86Multiply(k3, c3);
      k3 = x86Rotl(k3, 17);
      k3 = x86Multiply(k3, c4);
      h3 ^= k3;

    case 8:
      k2 ^= key.charCodeAt(i + 7) << 24;

    case 7:
      k2 ^= key.charCodeAt(i + 6) << 16;

    case 6:
      k2 ^= key.charCodeAt(i + 5) << 8;

    case 5:
      k2 ^= key.charCodeAt(i + 4);
      k2 = x86Multiply(k2, c2);
      k2 = x86Rotl(k2, 16);
      k2 = x86Multiply(k2, c3);
      h2 ^= k2;

    case 4:
      k1 ^= key.charCodeAt(i + 3) << 24;

    case 3:
      k1 ^= key.charCodeAt(i + 2) << 16;

    case 2:
      k1 ^= key.charCodeAt(i + 1) << 8;

    case 1:
      k1 ^= key.charCodeAt(i);
      k1 = x86Multiply(k1, c1);
      k1 = x86Rotl(k1, 15);
      k1 = x86Multiply(k1, c2);
      h1 ^= k1;
  }

  h1 ^= key.length;
  h2 ^= key.length;
  h3 ^= key.length;
  h4 ^= key.length;

  h1 += h2;
  h1 += h3;
  h1 += h4;
  h2 += h1;
  h3 += h1;
  h4 += h1;

  h1 = x86Fmix(h1);
  h2 = x86Fmix(h2);
  h3 = x86Fmix(h3);
  h4 = x86Fmix(h4);

  h1 += h2;
  h1 += h3;
  h1 += h4;
  h2 += h1;
  h3 += h1;
  h4 += h1;

  return ('00000000' + (h1 >>> 0).toString(16)).slice(-8) + ('00000000' + (h2 >>> 0).toString(16)).slice(-8) + ('00000000' + (h3 >>> 0).toString(16)).slice(-8) + ('00000000' + (h4 >>> 0).toString(16)).slice(-8);
}

/**
 * x86 version of Murmur3 for 128bits.
 * Used by hashImpression128 because in JS it is more efficient than the x64 version, no matter the underlying OS/CPU arch.
 *
 * @param {string} str
 */
export function hash128(str /*: string */, seed /*: number */) /*: string */ {
  return hash128x86(UTF16ToUTF8(str), seed >>> 0);
}
