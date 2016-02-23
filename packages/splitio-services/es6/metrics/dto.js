'use strict';

module.exports = {
  fromGetTreatmentCollector(collector) {
    return {
      name: 'sdk.getTreatment',
      latencies: collector
    };
  }
};
