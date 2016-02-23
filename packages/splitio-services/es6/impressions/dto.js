'use strict';

const groupBy = require('lodash.groupby');

module.exports = {
  fromImpressionsCollector(collector) {
    let groupedByFeature = groupBy(collector.state(), 'feature');
    let dto = [];

    for (let name in groupedByFeature) {
      dto.push({
        testName: name,
        keyImpressions: groupedByFeature[name].map(entry => {
          return {
            keyName: entry.key,
            treatment: entry.treatment,
            time: entry.when
          };
        })
      });
    }

    return dto;
  }
};
