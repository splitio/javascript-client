'use strict';

/**
Copyright 2016 Split Software

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
**/

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