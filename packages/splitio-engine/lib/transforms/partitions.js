/* @flow */'use strict';

var partitionTypes = require('../partitions/types');

/**
 * Transform the partitions structure in something optimal for javascript.
 */
function transform() /*: Array<any> */ /*: Map<any, number> */{
  var partitions = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];

  return partitions.reduce(function (accum, partition) {
    return accum.set(partitionTypes.type(partition.treatment), partition.size);
  }, new Map());
}

module.exports = transform;
//# sourceMappingURL=partitions.js.map