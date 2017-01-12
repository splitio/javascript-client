// @flow

'use strict';

const startsWith = require('core-js/library/fn/string/starts-with');

const buildImpressionsKey
  = (sdkVersion: string, instanceId: string, splitName: string) =>
    `SPLITIO/${sdkVersion}/${instanceId}/impressions.${splitName}`;

const buildLatencyKey
  = (sdkVersion: string, instanceId: string, metricName: string, bucketNumber: number) =>
    `SPLITIO/${sdkVersion}/${instanceId}/latency.${metricName}.bucket.${bucketNumber}`;

const buildSegmentNameKey = (segmentName: string) => `SPLITIO.segment.${segmentName}`;
const buildSegmentTillKey = (segmentName: string) => `SPLITIO.segment.${segmentName}.till`;
const buildRegisteredSegmentsKey = () => 'SPLITIO.segments.registered';
const buildSegmentsReady = (): string => 'SPLITIO.segments.ready';

const buildSplitKey = (splitName: string): string => `SPLITIO.split.${splitName}`;
const buildSplitsTillKey = (): string => 'SPLITIO.splits.till';
const buildSplitsReady = (): string => 'SPLITIO.splits.ready';

const searchPatternForSplitKeys = (): string => 'SPLITIO.split.*';

const isSplitKey = (key: string) => startsWith(key, 'SPLITIO.split.');

const extractKey = (builtKey: string) => builtKey.substring(14);

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
  buildImpressionsKey,

  // Latencies
  buildLatencyKey,

  // Search Patterns
  searchPatternForSplitKeys,

  // is* functions
  isSplitKey,

  // extract functions
  extractKey
};
