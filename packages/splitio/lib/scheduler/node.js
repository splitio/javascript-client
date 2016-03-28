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

var settings = require('@splitsoftware/splitio-utils/lib/settings');
var SchedulerFactory = require('@splitsoftware/splitio-utils/lib/scheduler');

var _require = require('@splitsoftware/splitio-cache');

var splitChangesUpdater = _require.splitChangesUpdater;
var segmentsUpdater = _require.segmentsUpdater;


function scheduler() {
  var coreSettings = settings.get('core');
  var featuresRefreshRate = settings.get('featuresRefreshRate');
  var segmentsRefreshRate = settings.get('segmentsRefreshRate');

  var splitRefreshScheduler = SchedulerFactory();
  var segmentsRefreshScheduler = SchedulerFactory();

  // 1- Fetch Splits
  // 2- Fetch segments once we have all the Splits downloaded
  splitRefreshScheduler.forever(splitChangesUpdater, featuresRefreshRate, coreSettings).then(function () {
    return segmentsRefreshScheduler.forever(segmentsUpdater, segmentsRefreshRate, coreSettings);
  });
}

module.exports = scheduler;
//# sourceMappingURL=node.js.map