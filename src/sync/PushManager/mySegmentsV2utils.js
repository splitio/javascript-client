import { algorithms } from '../../utils/decompress';
import { decodeFromBase64 } from '../../utils/base64';

const GZIP = 1;
const ZLIB = 2;

function Uint8ArrayToString(myUint8Arr) {
  return String.fromCharCode.apply(null, myUint8Arr);
}

function StringToUint8Array(myString) {
  const charCodes = myString.split('').map((e) => e.charCodeAt());
  return new Uint8Array(charCodes);
}

/**
 * Decode and decompress 'data' with 'compression' algorithm
 *
 * @param {string} data
 * @param {number} compression 1 GZIP, 2 ZLIB
 * @returns {Uint8Array}
 * @throws if data string cannot be decoded, decompressed or the provided compression value is invalid (not 1 or 2)
 */
function decompress(data, compression) {
  let compressData = decodeFromBase64(data);
  const binData = StringToUint8Array(compressData);

  if (typeof algorithms === 'string') throw new Error(algorithms);
  if (compression === GZIP) return algorithms.gunzipSync(binData);
  if (compression === ZLIB) return algorithms.unzlibSync(binData);
  throw new Error(`Invalid compression algorithm #${compression}`);
}

/**
 * Decode, decompress and parse the provided 'data' into a KeyList object
 *
 * @param {string} data
 * @param {number} compression
 * @returns {{a?: string[], r?: string[] }}
 * @throws if data string cannot be decoded, decompressed or parsed
 */
export function parseKeyList(data, compression) {
  const binKeyList = decompress(data, compression);
  const strKeyList = Uint8ArrayToString(binKeyList);

  // replace numbers to strings, to avoid losing precision
  return JSON.parse(strKeyList.replace(/\d+/g, '"$&"'));
}

/**
 * Decode, decompress and parse the provided 'data' into a Bitmap object
 *
 * @param {string} data
 * @param {number} compression
 * @returns {Uint8Array}
 * @throws if data string cannot be decoded or decompressed
 */
export function parseBitmap(data, compression) {
  return decompress(data, compression);
}

/**
 * Check if the 'bitmap' bit at 'hash64hex' position is 1
 *
 * @param {Uint8Array} bitmap
 * @param {string} hash64hex 16-chars string, representing a number in hexa
 * @returns {boolean}
 */
export function isInBitmap(bitmap, hash64hex) {
  // using the lowest 32 bits as index, to avoid losing precision when converting to number
  const index = parseInt(hash64hex.slice(8), 16) % (bitmap.length * 8);

  const internal = Math.floor(index / 8);
  const offset = index % 8;
  return (bitmap[internal] & 1 << offset) > 0;
}
