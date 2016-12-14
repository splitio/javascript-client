// @flow

'use strict';

const buildImpressionsKey
  = (sdkVersion : string, instanceId : string, splitName : string) =>
    `SPLITIO/${sdkVersion}/${instanceId}/impressions.${splitName}`;

const buildLatencyKey
  = (sdkVersion : string, instanceId : string, metricName : string, bucketNumber : number) =>
    `SPLITIO/${sdkVersion}/${instanceId}/latency.${metricName}.bucket.${bucketNumber}`;

const buildSegmentNameKey = (segmentName : string) => `SPLITIO.segment.${segmentName}`;
const buildSegmentTillKey = (segmentName : string) => `SPLITIO.segment.${segmentName}.till`;
const buildRegisteredSegmentsKey = () => 'SPLITIO.segments.registered';
const buildSegmentsReady = () : string => 'SPLITIO.segments.ready';

const buildSplitKey = (splitName : string) : string => `SPLITIO.split.${splitName}`;
const buildSplitsTillKey = () : string => 'SPLITIO.splits.till';
const buildSplitsReady = () : string => 'SPLITIO.splits.ready';

const searchPatternForSplitKeys = () : string => `SPLITIO.split.*`;

const isSplitKey = (key : string) => key.startsWith('SPLITIO.split.');

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
  isSplitKey
};
