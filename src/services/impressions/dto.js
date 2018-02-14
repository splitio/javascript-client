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
import groupBy from 'lodash/groupBy';

export function fromImpressionsCollector(collector, settings) {
  const sendLabels = settings.core.labelsEnabled;
  let groupedByFeature = groupBy(collector.state(), 'feature');
  let dto = [];

  for (let name in groupedByFeature) {
    dto.push({
      testName: name,
      keyImpressions: groupedByFeature[name].map(entry => {
        const keyImpression = {
          keyName: entry.keyName,
          treatment: entry.treatment,
          time: entry.time,
          changeNumber: entry.changeNumber
        };

        if (sendLabels) keyImpression.label = entry.label;
        if (entry.bucketingKey) keyImpression.bucketingKey = entry.bucketingKey;

        return keyImpression;
      })
    });
  }

  return dto;
}
