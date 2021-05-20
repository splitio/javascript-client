import { startsWith } from '../utils/lang';

const everythingAtTheEnd = /[^.]+$/;
const everythingAfterCount = /count\.([^/]+)$/;
const latencyMetricNameAndBucket = /latency\.([^/]+)\.bucket\.([0-9]+)$/;

class KeyBuilder {
  constructor(settings) {
    this.settings = settings;
  }

  buildSplitKey(splitName) {
    return `${this.settings.storage.prefix}.split.${splitName}`;
  }

  buildTrafficTypeKey(trafficType) {
    return `${this.settings.storage.prefix}.trafficType.${trafficType}`;
  }

  buildSplitsTillKey() {
    return `${this.settings.storage.prefix}.splits.till`;
  }

  buildSplitsReady() {
    return `${this.settings.storage.prefix}.splits.ready`;
  }

  isSplitKey(key) {
    return startsWith(key, `${this.settings.storage.prefix}.split.`);
  }

  buildSegmentNameKey(segmentName) {
    return `${this.settings.storage.prefix}.segment.${segmentName}`;
  }

  buildSegmentTillKey(segmentName) {
    return `${this.settings.storage.prefix}.segment.${segmentName}.till`;
  }

  buildRegisteredSegmentsKey() {
    return `${this.settings.storage.prefix}.segments.registered`;
  }

  buildSegmentsReady() {
    return `${this.settings.storage.prefix}.segments.ready`;
  }

  buildVersionablePrefix() {
    return `${this.settings.storage.prefix}/${this.settings.version}/${this.settings.runtime.ip}`;
  }

  buildImpressionsKey() {
    return `${this.settings.storage.prefix}.impressions`;
  }

  buildEventsKey() {
    return `${this.settings.storage.prefix}.events`;
  }

  buildLatencyKeyPrefix() {
    return `${this.buildVersionablePrefix()}/latency`;
  }

  buildLatencyKey(metricName, bucketNumber) {
    return `${this.buildLatencyKeyPrefix()}.${metricName}.bucket.${bucketNumber}`;
  }

  buildCountKey(metricName) {
    return `${this.buildVersionablePrefix()}/count.${metricName}`;
  }

  buildGaugeKey(metricName) {
    return `${this.buildVersionablePrefix()}/gauge.${metricName}`;
  }

  searchPatternForCountKeys() {
    return `${this.buildVersionablePrefix()}/count.*`;
  }

  searchPatternForSplitKeys() {
    return `${this.settings.storage.prefix}.split.*`;
  }

  searchPatternForLatency() {
    return `${this.buildLatencyKeyPrefix()}.*`;
  }

  extractKey(builtKey) {
    const s = builtKey.match(everythingAtTheEnd);

    if (s && s.length) {
      return s[0];
    } else {
      throw new Error('Invalid latency key provided');
    }
  }

  extractCounterName(counterKey) {
    const m = counterKey.match(everythingAfterCount);

    if (m && m.length) {
      return m[1]; // everything after count
    } else {
      throw new Error('Invalid counter key provided');
    }
  }

  extractLatencyMetricNameAndBucket(latencyKey) {
    const parts = latencyKey.match(latencyMetricNameAndBucket);

    if (parts && parts.length > 2) {
      return {
        metricName: parts[1],
        bucketNumber: parts[2]
      };
    } else {
      throw new Error('Invalid counter key provided');
    }
  }
}

export default KeyBuilder;
