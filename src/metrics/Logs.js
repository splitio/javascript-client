class SegmentChangesMetrics {
  constructor(storage) {
    this.storage = storage;
  }

  latency(ms) {
    this.storage.metrics.track('segmentChangeFetcher.time', ms);
  }

  count(status) {
    this.storage.count.track(`segmentChangeFetcher.status.${status}`);
  }

  countException() {
    this.storage.count.track('segmentChangeFetcher.exception');
  }
}

class SplitChangesMetrics {
  constructor(storage) {
    this.storage = storage;
  }

  latency(ms) {
    this.storage.metrics.track('splitChangeFetcher.time', ms);
  }

  count(status) {
    this.storage.count.track(`splitChangeFetcher.status.${status}`);
  }

  countException() {
    this.storage.count.track('splitChangeFetcher.exception');
  }
}

class MySegmentsMetrics {
  constructor(storage) {
    this.storage = storage;
  }

  latency(ms) {
    this.storage.metrics.track('mySegmentsFetcher.time', ms);
  }

  count(status) {
    this.storage.count.track(`mySegmentsFetcher.status.${status}`);
  }

  countException() {
    this.storage.count.track('mySegmentsFetcher.exception');
  }
}

class SDKMetrics {
  constructor(storage) {
    this.storage = storage;
  }

  ready(ms) {
    this.storage.metrics.track('sdk.ready', ms);
  }

  latency(ms) {
    this.storage.metrics.track('sdk.getTreatment', ms);
  }
}

module.exports = {
  SegmentChangesMetrics,
  SplitChangesMetrics,
  MySegmentsMetrics,
  SDKMetrics
};
