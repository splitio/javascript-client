// @flow

'use strict';

const startsWith = require('core-js/library/fn/string/starts-with');

const buildImpressionsKey
  = (sdkVersion: string, instanceId: string, splitName: string) =>
    buildImpressionsKeyPrefix(sdkVersion, instanceId) + `.${splitName}`;

const buildImpressionsKeyPrefix
  = (sdkVersion: string, instanceId: string) =>
    `SPLITIO/${sdkVersion}/${instanceId}/impressions`;

const buildLatencyKey
  = (sdkVersion: string, instanceId: string, metricName: string, bucketNumber: number) =>
    buildLatencyKeyPrefix(sdkVersion, instanceId) + `.${metricName}.bucket.${bucketNumber}`;

const buildLatencyKeyPrefix
  = (sdkVersion: string, instanceId: string) =>
    `SPLITIO/${sdkVersion}/${instanceId}/latency`;

const buildSegmentNameKey = (segmentName: string) => `SPLITIO.segment.${segmentName}`;
const buildSegmentTillKey = (segmentName: string) => `SPLITIO.segment.${segmentName}.till`;
const buildRegisteredSegmentsKey = () => 'SPLITIO.segments.registered';
const buildSegmentsReady = (): string => 'SPLITIO.segments.ready';

const buildSplitKey = (splitName: string): string => `SPLITIO.split.${splitName}`;
const buildSplitsTillKey = (): string => 'SPLITIO.splits.till';
const buildSplitsReady = (): string => 'SPLITIO.splits.ready';

const searchPatternForSplitKeys = (): string => 'SPLITIO.split.*';
const searchPatternForImpressions = (sdkVersion: string, instanceId: string): string => buildImpressionsKeyPrefix(sdkVersion, instanceId) + '.*';
const searchPatternForLatency = (sdkVersion: string, instanceId: string): string => buildLatencyKeyPrefix(sdkVersion, instanceId) + '.*';

const isSplitKey = (key: string) => startsWith(key, 'SPLITIO.split.');

const extractKey = (builtKey: string) => builtKey.substring(14);
const extractBucketNumber = (latencyKey: string) => {
  const m = latencyKey.match(/\d+$/);

  if (m && m.length) {
    return m[0];
  } else {
    throw 'Invalid latency key provided';
  }
};

module.exports = {
  // Splits
  buildSplitKey,
  buildSplitsTillKey,
  buildSplitsReady,

  // Segments
  buildSegmentNameKey,
  buildSegmentTillKey,
  buildRegisteredSegmentsKey,
  buildSegmentsReady,

  // Impressions
  buildImpressionsKeyPrefix,
  buildImpressionsKey,

  // Latencies
  buildLatencyKeyPrefix,
  buildLatencyKey,
  extractBucketNumber,

  // Search Patterns
  searchPatternForSplitKeys,
  searchPatternForImpressions,
  searchPatternForLatency,

  // is* functions
  isSplitKey,

  // extract functions
  extractKey
};
