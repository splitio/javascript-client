/* @flow */ 'use strict';

let SchedulerFactory = require('@splitsoftware/splitio-utils/lib/scheduler');

let splitSettings = require('../settings');

let {
  splitChangesUpdater,
  segmentsUpdater
} = require('@splitsoftware/splitio-cache');

let metrics = require('@splitsoftware/splitio-metrics');

let _isStarted = false;
let core = {
  start() {
    if (!_isStarted) {
      _isStarted = true;
    } else {
      return Promise.reject('Engine already started');
    }

    let coreSettings = splitSettings.get('core');
    let featuresRefreshRate = splitSettings.get('featuresRefreshRate');
    let segmentsRefreshRate = splitSettings.get('segmentsRefreshRate');
    let metricsRefreshRate = splitSettings.get('metricsRefreshRate');

    let splitRefreshScheduler = SchedulerFactory();
    let segmentsRefreshScheduler = SchedulerFactory();
    let metricsPushScheduler = SchedulerFactory();

    // send stats to split servers if needed.
    metricsPushScheduler.forever(metrics.publish, metricsRefreshRate);

    // the first time the download is sequential:
    // 1- download feature settings
    // 2- segments
    return splitRefreshScheduler.forever(splitChangesUpdater, featuresRefreshRate, coreSettings).then(() => {
      return segmentsRefreshScheduler.forever(segmentsUpdater, segmentsRefreshRate, coreSettings);
    });
  },

  isStared() {
    return _isStarted;
  }
};

module.exports = core;
