'use strict';

var partitionTypes = require('../partitions/types');
var murmur = require('murmurhash-js');

var engine = {
  /**
   * Defines how much error we could have at the moment we run percentage calculations.
   */
  TOLERANCE: 1, // For now, we consider 1% acceptable.

  /**
   * Get the treatment name given a key, and the seed of the feature.
   *
   * @param {string} key        - Unique key for a given user.
   * @param {number} seed       - Seed create for the Split we are evaluating.
   * @param {Map}    partitions - Partition Map describing percentages distributions (only ON/OFF for now).
   *
   * @return {boolean}
   */
  isOn(key /*: string */, seed /*: number */, partitions /*: Map */) {
    return partitions.get(partitionTypes.enum.ON) >= (murmur(key, seed) % 100);
  }
};

module.exports = engine;
