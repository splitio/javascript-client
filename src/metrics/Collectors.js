class MetricsCollector {
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

export class SegmentChangesCollector extends MetricsCollector {
  constructor(storage) {
    super(storage);

    this.metricType = 'segmentChangeFetcher';
  }
}

export class SplitChangesCollector extends MetricsCollector {
  constructor(storage) {
    super(storage);

    this.metricType = 'splitChangeFetcher';
  }
}

export class MySegmentsCollector extends MetricsCollector {
  constructor(storage) {
    super(storage);

    this.metricType = 'mySegmentsFetcher';
  }
}

export class SDKCollector {
  constructor(storage) {
    this.storage = storage;

    this.ready = this.ready.bind(this);
    this.latency = this.latency.bind(this);
  }

  ready(ms) {
    this.storage.metrics.track('sdk.ready', ms);
  }

  latency(ms) {
    this.storage.metrics.track('sdk.getTreatment', ms);
  }
}
