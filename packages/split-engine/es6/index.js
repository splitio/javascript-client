'use strict';

var partitionTypes = require('split-parser/src/partitions/types');
var murmur = require('murmurhash-js');

var engine = {
  /**
   * Get the treatment name given a key, and the seed of the feature.
   *
   * @param {string} key        - Unique key for a given user.
   * @param {number} seed       - Seed create for the Split we are evaluating.
   * @param {Map}    partitions - Partition Map describing percentages distributions (only ON/OFF for now).
   *
   * @return {boolean}
   */
  isOn(key, seed, partitions) {
    return partitions.get(partitionTypes.enum.ON) >= (murmur(key, seed) % 100 + 1);
  }
};

module.exports = engine;
