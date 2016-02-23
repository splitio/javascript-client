'use strict';

const settings = require('@splitsoftware/splitio-utils/lib/settings');
const SchedulerFactory = require('@splitsoftware/splitio-utils/lib/scheduler');

const metricsService = require('@splitsoftware/splitio-services/lib/metrics');
const metricsServiceRequest = require('@splitsoftware/splitio-services/lib/metrics/post');
const metricsDTO = require('@splitsoftware/splitio-services/lib/metrics/dto');

const impressionsService = require('@splitsoftware/splitio-services/lib/impressions');
const impressionsServiceRequest = require('@splitsoftware/splitio-services/lib/impressions/post');
const impressionsDTO = require('@splitsoftware/splitio-services/lib/impressions/dto');

const PassThroughFactory = require('./tracker/PassThrough');
const TimerFactory = require('./tracker/Timer');

const SequentialCollector = require('./collector/Sequential');
const FibonacciCollector = require('./collector/Fibonacci');

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
    impressionsService(impressionsServiceRequest({
      body: JSON.stringify(impressionsDTO.fromImpressionsCollector(impressionsCollector))
    })).then(resp => {
      impressions.clear();
      return resp;
    }).catch(error => {
      impressions.clear();
    });
  }
}

performanceScheduler.forever(publishToTime, settings.get('metricsRefreshRate'));
impressionsScheduler.forever(publishToImpressions, settings.get('impressionsRefreshRate'));

modules.exports = {
  impressions: PassThroughFactory(impressionsCollector),
  getTreatment: TimerFactory(getTreatmentCollector)
};
