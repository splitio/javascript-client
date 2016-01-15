'use strict';

var partitionTypes = require('../partitions/types');

/**
 * Transform the partitions structure in something optimal for javascript.
 *
 * @params {Array<{treatmet: string, size: number}>} partitions
 *
 * @return {Map<partitionTypes.enum, number>}
 */
function transform(partitions = []) {
  return partitions.reduce((accum, partition) => {
    return accum.set(
      partitionTypes.type(partition.treatment),
      partition.size
    );
  }, new Map());
}

module.exports = transform;
