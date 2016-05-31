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

// const settings = require('@splitsoftware/splitio-utils/lib/settings');
var SchedulerFactory = require('@splitsoftware/splitio-utils/lib/scheduler');

var Store = require('@splitsoftware/splitio-cache/lib/storage');

var _require = require('@splitsoftware/splitio-cache');

var SplitChangesUpdater = _require.SplitChangesUpdater;
var SegmentsUpdater = _require.SegmentsUpdater;


module.exports = function scheduler(settings, hub) {
  var coreSettings = settings.get('core');
  var featuresRefreshRate = settings.get('featuresRefreshRate');
  var segmentsRefreshRate = settings.get('segmentsRefreshRate');

  var splitRefreshScheduler = SchedulerFactory();
  var segmentsRefreshScheduler = SchedulerFactory();

  var storage = Store.createStorage();

  // 1- Fetch Splits
  // 2- Fetch segments once we have all the Splits downloaded
  return splitRefreshScheduler.forever(SplitChangesUpdater(settings, hub, storage), featuresRefreshRate, coreSettings).then(function scheduleSegmentsFetcher() {
    return segmentsRefreshScheduler.forever(SegmentsUpdater(settings, hub, storage), segmentsRefreshRate, coreSettings);
  }).then(function () {
    return storage;
  });
};