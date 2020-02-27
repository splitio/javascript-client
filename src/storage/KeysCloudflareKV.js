import KeyBuilder from './Keys';

class KeyBuilderForCloudflareKV extends KeyBuilder {
  buildImpressionsKey(impression) {
    const suffix = getRandomString(10)
    return `${this.settings.storage.prefix}.impressions.${impression.time}.${suffix}`;
  }

  searchPatternForSplitKeys() {
    return `${this.settings.storage.prefix}.split.`;
  }
}

/**
 * Generate a random string of the given length
 * Reference: https://medium.com/@dazcyril/generating-cryptographic-random-state-in-javascript-in-the-browser-c538b3daae50
 * @param {number} length The length of the random string to generate
 * @return {string} The random string
 */
function getRandomString(length) {
  const validChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let array = new Uint8Array(length);
  crypto.getRandomValues(array);
  array = array.map(x => validChars.charCodeAt(x % validChars.length));
  return String.fromCharCode.apply(null, array);
}

export default KeyBuilderForCloudflareKV;
