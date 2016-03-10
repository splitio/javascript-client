//
// JAVA reference implementation for the hashing function.
//
// int h = 0;
// for (int i = 0; i < key.length(); i++) {
//     h = 31 * h + key.charAt(i);
// }
// return h ^ seed; // XOR the hash and seed
//

function ToInteger(x) {
  x = Number(x);
  return x < 0 ? Math.ceil(x) : Math.floor(x);
}

function modulo(a, b) {
  return a - Math.floor(a/b)*b;
}

function ToUint32(x) {
  return modulo(ToInteger(x), Math.pow(2, 32));
}

function ToInt32(x) {
  let uint32 = ToUint32(x);

  if (uint32 >= Math.pow(2, 31)) {
    return uint32 - Math.pow(2, 32);
  } else {
    return uint32;
  }
}

function hash(str /*: string */, seed /*: number */) /*: number */ {
  let h = 0;

  for (let c of str) {
    h = ToInt32( ToInt32(31 * h) + c.charCodeAt(0) );
  }

  return ToInt32( h ^ seed );
}

function bucket(str /*: string */, seed /*: number */) /*: number */ {
  return Math.abs(hash(str, seed) % 100) + 1;
}

module.exports = {
  hash,
  bucket
};
