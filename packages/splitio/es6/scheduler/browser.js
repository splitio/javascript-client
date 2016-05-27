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
const settings = require('@splitsoftware/splitio-utils/lib/settings');
const SchedulerFactory = require('@splitsoftware/splitio-utils/lib/scheduler');

const Store = require('@splitsoftware/splitio-cache/lib/storage');
const {splitChangesUpdater, segmentsUpdater} = require('@splitsoftware/splitio-cache');

function scheduler() {
  const coreSettings = settings.get('core');
  const featuresRefreshRate = settings.get('featuresRefreshRate');
  const segmentsRefreshRate = settings.get('segmentsRefreshRate');

  const splitRefreshScheduler = SchedulerFactory();
  const segmentsRefreshScheduler = SchedulerFactory();

  const storage = Store.createStorage();

  // Fetch Splits and Segments in parallel (there is none dependency between
  // Segments and Splits)
  return Promise.all([
    splitRefreshScheduler.forever(splitChangesUpdater(storage), featuresRefreshRate, coreSettings),
    segmentsRefreshScheduler.forever(segmentsUpdater(storage), segmentsRefreshRate, coreSettings)
  ]).then(() => {
    return storage;
  });
}

module.exports = scheduler;
