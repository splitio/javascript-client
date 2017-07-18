/**
 * Details of Metrics for the different parts of the system.
 *
 * latency => sdk.ready
 * latency => sdk.getTreatment
 *
 * latency => splitChangeFetcher.time
 * count   => splitChangeFetcher.status.XXX
 * count   => splitChangeFetcher.exception
 *
 * latency => segmentChangeFetcher.time
 * count   => segmentChangeFetcher.status.XXX
 * count   => segmentChangeFetcher.exception
 *
 * latency => mySegmentsFetcher.time
 * count   => mySegmentsFetcher.status.XXX
 * count   => mySegmentsFetcher.exception
 */

class SegmentChangesMetrics {
  constructor(storage) {
    this.storage = storage;
  }

  latency(ms) {

  }

  count(status) {

  }

  countException() {

  }

}

class SplitChangesMetrics {

  latency(ms) {

  }

  count(status) {

  }

  countException() {

  }

}

class MySegmentsMetrics {

  latency(ms) {

  }

  count(status) {

  }

  countException() {

  }

}

class SDKMetrics {

  ready(ms) {

  }

  latency(ms) {

  }

}

module.exports = {
  SegmentChangesMetrics,
  SplitChangesMetrics,
  MySegmentsMetrics,
  SDKMetrics
};
