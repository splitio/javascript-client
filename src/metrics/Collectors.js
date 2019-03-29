class ProducerMetricsCollector {
  constructor(storage) {
    this.storage = storage;

    this.latency = this.latency.bind(this);
    this.count = this.count.bind(this);
    this.countException = this.countException.bind(this);
  }

  latency(ms) {
    this.storage.metrics.track(`${this.metricType}.time`, ms);
  }

  count(status) {
    this.storage.count.track(`${this.metricType}.status.${status}`);
  }

  countException() {
    this.storage.count.track(`${this.metricType}.exception`);
  }
}

export class SegmentChangesCollector extends ProducerMetricsCollector {
  constructor(storage) {
    super(storage);

    this.metricType = 'segmentChangeFetcher';
  }
}

export class SplitChangesCollector extends ProducerMetricsCollector {
  constructor(storage) {
    super(storage);

    this.metricType = 'splitChangeFetcher';
  }
}

export class MySegmentsCollector extends ProducerMetricsCollector {
  constructor(storage) {
    super(storage);

    this.metricType = 'mySegmentsFetcher';
  }
}

export class ClientCollector {
  constructor(storage) {
    this.storage = storage;

    this.ready = this.ready.bind(this);
    this.getTreatment = this.getTreatment.bind(this);
    this.getTreatments = this.getTreatments.bind(this);
    this.getTreatmentWithConfig = this.getTreatmentWithConfig.bind(this);
    this.getTreatmentsWithConfig = this.getTreatmentsWithConfig.bind(this);
  }

  ready(ms) {
    this.storage.metrics.track('sdk.ready', ms);
  }

  getTreatment(ms) {
    this.storage.metrics.track('sdk.getTreatment', ms);
  }

  getTreatments(ms) {
    this.storage.metrics.track('sdk.getTreatments', ms);
  }

  getTreatmentWithConfig(ms) {
    this.storage.metrics.track('sdk.getTreatmentWithConfig', ms);
  }

  getTreatmentsWithConfig(ms) {
    this.storage.metrics.track('sdk.getTreatmentsWithConfig', ms);
  }
}
