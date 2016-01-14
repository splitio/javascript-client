'use strict';

var partitionTypes = require('../partitions/types');
var murmur = require('murmurhash-js');

var engine = {
  /**
   * Defines how much error we could have at the moment we run percentage calculations.
   * => For now, we consider 0.1% acceptable.
   */
  TOLERANCE: 0.1,

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
