'use strict';

var groupBy = require('lodash.groupby');

module.exports = {
  fromImpressionsCollector: function fromImpressionsCollector(collector) {
    var groupedByFeature = groupBy(collector.state(), 'feature');
    var dto = [];

    for (var name in groupedByFeature) {
      dto.push({
        testName: name,
        keyImpressions: groupedByFeature[name].map(function (entry) {
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
//# sourceMappingURL=dto.js.map