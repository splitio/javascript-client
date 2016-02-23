'use strict';

module.exports = {
  fromGetTreatmentCollector: function fromGetTreatmentCollector(collector) {
    return {
      name: 'sdk.getTreatment',
      latencies: collector
    };
  }
};
//# sourceMappingURL=dto.js.map