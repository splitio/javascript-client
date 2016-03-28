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
const {
  splitChangesUpdater, segmentsUpdater
} = require('@splitsoftware/splitio-cache');

function scheduler() {
  let coreSettings = settings.get('core');
  let featuresRefreshRate = settings.get('featuresRefreshRate');
  let segmentsRefreshRate = settings.get('segmentsRefreshRate');

  let splitRefreshScheduler = SchedulerFactory();
  let segmentsRefreshScheduler = SchedulerFactory();

  // 1- Fetch Splits
  // 2- Fetch segments once we have all the Splits downloaded
  splitRefreshScheduler.forever(
    splitChangesUpdater, featuresRefreshRate, coreSettings
  ).then(function () {
    return segmentsRefreshScheduler.forever(
      segmentsUpdater, segmentsRefreshRate, coreSettings
    );
  });
}

module.exports = scheduler;
