'use strict';

var segmentChangesDataSource = require('./segmentChanges');
var splitChangesDataSource = require('./splitChanges');

module.exports = {

  keys: {
    SEGMENT_CHANGES: Symbol(),
    SPLIT_CHANGES: Symbol()
  },

  getDataSource(dataSourceKey) {
    var servicesKeys = this.keys;

    switch(dataSourceKey) {

      case this.keys.SEGMENT_CHANGES:
        return segmentChangesDataSource;

      case this.keys.SPLIT_CHANGES:
        return splitChangesDataSource;

      default:
        throw new Error(`Invalid dataSourceKey parameter`);
    }
  },

  factory({dataSourceKey, ...params}) {

    return {
      instanceId: Symbol(),
      request: ( ) => {
        return this.getDataSource(dataSourceKey)(params);
      }
    };
  }

};
