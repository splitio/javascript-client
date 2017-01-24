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

// @flow

'use strict';

const log = require('debug')('splitio-producer:offline');

function FromObjectUpdaterFactory(Fetcher: Function, settings: Settings, readiness: ReadinessGate, storage: SplitStorage) {

  return async function ObjectUpdater() {
    const splits = [];
    const configs = Fetcher(settings);

    log(JSON.stringify(configs));

    // Make use of the killed behavior to prevent loading all the information
    // for a given Split.
    for (let name in configs) splits.push([
      name,
      JSON.stringify({
        name,
        status: 'ACTIVE',
        killed: true,
        defaultTreatment: configs[name],
        conditions: []
      })
    ]);

    await storage.splits.flush();
    await storage.splits.addSplits(splits);

    readiness.splits.emit(readiness.splits.SDK_SPLITS_ARRIVED);
    readiness.segments.emit(readiness.segments.SDK_SEGMENTS_ARRIVED);
  };

}

module.exports = FromObjectUpdaterFactory;
