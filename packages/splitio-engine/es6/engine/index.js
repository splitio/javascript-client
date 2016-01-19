/* @flow */ 'use strict';

let partitionTypes = require('../partitions/types');
let murmur = require('murmurhash-js');
let log = require('debug')('splitio-engine');

let engine = {
  /**
   * Defines how much error we could have at the moment we run percentage calculations.
   */
  TOLERANCE: 1, // For now, we consider 1% acceptable.

  /**
   * Get the treatment name given a key, and the seed of the feature.
   */
  isOn(key /*: string */, seed /*: number */, partitions /*: Map */) /*: boolean */ {
    let percentageOn = partitions.get(partitionTypes.enum.ON);
    let keyPercentageValue = (murmur(key, seed) % 100);

    log(`[engine] percentage on ${percentageOn} and key ${keyPercentageValue}`);

    return percentageOn >= keyPercentageValue;
  }
};

module.exports = engine;
