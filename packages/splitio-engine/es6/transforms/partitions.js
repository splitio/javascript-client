/* @flow */ 'use strict';

let partitionTypes = require('../partitions/types');

/**
 * Transform the partitions structure in something optimal for javascript.
 */
function transform(partitions = [] /*: Array<any> */) /*: Map<any, number> */ {
  return partitions.reduce((accum, partition) => {
    return accum.set(
      partitionTypes.type(partition.treatment),
      partition.size
    );
  }, new Map());
}

module.exports = transform;
