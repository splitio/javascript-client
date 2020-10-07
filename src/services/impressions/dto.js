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
import { groupBy, forOwn } from '../../utils/lang';

export function fromImpressionsCollector(collector, settings) {
  const sendLabels = settings.core.labelsEnabled;
  let groupedByFeature = groupBy(collector.state(), 'feature');
  let dto = [];

  // using forOwn instead of for...in since the last also iterates over prototype enumerables
  forOwn(groupedByFeature, (value, name) => {
    dto.push({
      f: name, // Test Name
      i: value.map(entry => { // Key Impressions
        const keyImpression = {
          k: entry.keyName, // Key
          t: entry.treatment, // Treatment
          m: entry.time, // Timestamp
          c: entry.changeNumber // ChangeNumber
        };

        if (sendLabels) keyImpression.r = entry.label; // Rule
        if (entry.bucketingKey) keyImpression.b = entry.bucketingKey; // Bucketing Key
        if (entry.pt) keyImpression.pt = entry.pt;

        return keyImpression;
      })
    });
  });

  return dto;
}

export function fromImpressionsCountCollector(collector) {
  const imprCounts = collector ? collector.size() : 0;
  const pf = [];
  if (imprCounts === 0) return pf;

  const impressionsCount = collector.popAll();

  const keys = Object.keys(impressionsCount);
  for (let i = 0; i < keys.length; i++) {
    const splitted = keys[i].split('::');
    if (splitted.length !== 2) continue;
    const featureName = splitted[0];
    const timeFrame = splitted[1];

    const impressionsInTimeframe = {
      f: featureName, // Test Name
      m: Number(timeFrame), // Time Frame
      rc: impressionsCount[keys[i]] // Count
    };

    pf.push(impressionsInTimeframe);
  }

  return pf;
}
