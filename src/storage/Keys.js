// @flow

'use strict';

const startsWith = require('core-js/library/fn/string/starts-with');

const everythingAtTheEnd = /[^.]+$/;
const everyDigitAtTheEnd = /\d+$/;

class KeyBuilder {
  settings: Settings;

  constructor(settings: Settings) {
    this.settings = settings;
  }

  buildSplitKey(splitName: string): string {
    return `${this.settings.storage.prefix}.split.${splitName}`;
  }

  buildSplitsTillKey(): string {
    return `${this.settings.storage.prefix}.splits.till`;
  }

  buildSplitsReady(): string {
    return `${this.settings.storage.prefix}.splits.ready`;
  }

  isSplitKey(key: string) {
    return startsWith(key, `${this.settings.storage.prefix}.split.`);
  }

  buildSegmentNameKey(segmentName: string) {
    return `${this.settings.storage.prefix}.segment.${segmentName}`;
  }

  buildSegmentTillKey(segmentName: string) {
    return `${this.settings.storage.prefix}.segment.${segmentName}.till`;
  }

  buildRegisteredSegmentsKey() {
    return `${this.settings.storage.prefix}.segments.registered`;
  }

  buildSegmentsReady(): string {
    return `${this.settings.storage.prefix}.segments.ready`;
  }

  buildImpressionsKeyPrefix(): string {
    return `${this.settings.storage.prefix}/${this.settings.version}/${this.settings.runtime.ip}/impressions`;
  }

  buildImpressionsKey(splitName: string) {
    return this.buildImpressionsKeyPrefix() + `.${splitName}`;
  }

  buildLatencyKeyPrefix(): string {
    return `${this.settings.storage.prefix}/${this.settings.version}/${this.settings.runtime.ip}/latency`;
  }

  buildLatencyKey(metricName: string, bucketNumber: number) {
    return this.buildLatencyKeyPrefix() + `.${metricName}.bucket.${bucketNumber}`;
  }

  searchPatternForSplitKeys(): string {
    return `${this.settings.storage.prefix}.split.*`;
  }

  searchPatternForImpressions(): string {
    return this.buildImpressionsKeyPrefix() + '.*';
  }

  searchPatternForLatency(): string {
    return this.buildLatencyKeyPrefix() + '.*';
  }

  extractKey(builtKey: string): string {
    const s = builtKey.match(everythingAtTheEnd);

    if (s && s.length) {
      return s[0];
    } else {
      throw 'Invalid latency key provided';
    }
  }

  extractBucketNumber(latencyKey: string) {
    const m = latencyKey.match(everyDigitAtTheEnd);

    if (m && m.length) {
      return parseInt(m[0], 10);
    } else {
      throw 'Invalid latency key provided';
    }
  }
}

module.exports = KeyBuilder;
