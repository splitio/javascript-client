'use strict';

const SchedulerFactory = require('@splitsoftware/splitio-utils/lib/scheduler');

const metricsService = require('@splitsoftware/splitio-services/lib/metrics');
const metricsServiceRequest = require('@splitsoftware/splitio-services/lib/metrics/post');
const metricsDTO = require('@splitsoftware/splitio-services/lib/metrics/dto');

const impressionsService = require('@splitsoftware/splitio-services/lib/impressions');
const impressionsBulkRequest = require('@splitsoftware/splitio-services/lib/impressions/bulk');
const impressionsDTO = require('@splitsoftware/splitio-services/lib/impressions/dto');

const PassThroughFactory = require('./tracker/PassThrough');
const TimerFactory = require('./tracker/Timer');

const SequentialCollector = require('./collector/sequential');
const FibonacciCollector = require('./collector/fibonacci');

const impressionsCollector = SequentialCollector();
const getTreatmentCollector = FibonacciCollector();

const performanceScheduler = SchedulerFactory();
const impressionsScheduler = SchedulerFactory();

function publishToTime() {
  if (!getTreatmentCollector.isEmpty()) {
    metricsService(metricsServiceRequest({
      body: JSON.stringify(metricsDTO.fromGetTreatmentCollector(getTreatmentCollector))
    })).then(resp => {
      getTreatmentCollector.clear(); // once saved, cleanup the collector
      return resp;
    }).catch(error => {
      getTreatmentCollector.clear(); // after try to save, cleanup the collector
    });
  }
}

function publishToImpressions() {
  if (!impressionsCollector.isEmpty()) {
    impressionsService(impressionsBulkRequest({
      body: JSON.stringify(impressionsDTO.fromImpressionsCollector(impressionsCollector))
    })).then(resp => {
      impressionsCollector.clear();
      return resp;
    }).catch(error => {
      impressionsCollector.clear();
    });
  }
}

module.exports = {
  start(settings) {
    performanceScheduler.forever(publishToTime, settings.get('metricsRefreshRate'));
    impressionsScheduler.forever(publishToImpressions, settings.get('impressionsRefreshRate'));
  },

  stop() {
    performanceScheduler.kill();
    impressionsScheduler.kill();
  },

  impressions: PassThroughFactory(impressionsCollector),
  getTreatment: TimerFactory(getTreatmentCollector)
};
