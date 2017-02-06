// @flow

'use strict';

const tape = require('tape');
const Keys = require('../Keys');

const SettingsFactory = require('../../utils/settings');

tape('KEYS / splits keys', function (assert) {
  const settings = SettingsFactory({
    core: {
      key: 'prevent-browser-testing-throw-exception-because-missing-key'
    }
  });
  const builder = new Keys(settings);

  const splitName = 'split_name__for_testing';
  const expectedKey = `SPLITIO.split.${splitName}`;
  const expectedTill = 'SPLITIO.splits.till';
  const expectedReady = 'SPLITIO.splits.ready';

  assert.true(builder.isSplitKey(expectedKey));
  assert.true(builder.buildSplitKey(splitName) === expectedKey);
  assert.true(builder.buildSplitsTillKey() === expectedTill);
  assert.true(builder.buildSplitsReady() === expectedReady);

  assert.true(builder.extractKey(
    builder.buildSplitKey(splitName)
  ) === splitName);

  assert.end();
});

tape('KEYS / splits keys with custom prefix', function (assert) {
  const prefix = 'js:1234:asd';
  const settings = SettingsFactory({
    core: {
      key: 'prevent-browser-testing-throw-exception-because-missing-key'
    },
    storage: {
      prefix
    }
  });
  const builder = new Keys(settings);

  const splitName = 'split_name__for_testing';
  const expectedKey = `${prefix}.SPLITIO.split.${splitName}`;
  const expectedTill = `${prefix}.SPLITIO.splits.till`;
  const expectedReady = `${prefix}.SPLITIO.splits.ready`;

  assert.true(builder.isSplitKey(expectedKey));
  assert.true(builder.buildSplitKey(splitName) === expectedKey);
  assert.true(builder.buildSplitsTillKey() === expectedTill);
  assert.true(builder.buildSplitsReady() === expectedReady);

  assert.end();
});

tape('KEYS / segments keys', function (assert) {
  const settings = SettingsFactory({
    core: {
      key: 'prevent-browser-testing-throw-exception-because-missing-key'
    }
  });
  const builder = new Keys(settings);

  const segmentName = 'segment_name__for_testing';
  const expectedKey = `SPLITIO.segment.${segmentName}`;
  const expectedTill = `SPLITIO.segment.${segmentName}.till`;
  const expectedReady = 'SPLITIO.segments.ready';
  const expectedSegmentRegistered = 'SPLITIO.segments.registered';

  assert.true(builder.buildSegmentNameKey(segmentName) === expectedKey);
  assert.true(builder.buildSegmentTillKey(segmentName) === expectedTill);
  assert.true(builder.buildSegmentsReady() === expectedReady);
  assert.true(builder.buildRegisteredSegmentsKey() === expectedSegmentRegistered);

  assert.end();
});

tape('KEYS / impressions & metrics keys', function (assert) {
  const prefix = 'SPLITIO';
  const settings = SettingsFactory({
    core: {
      key: 'prevent-browser-testing-throw-exception-because-missing-key'
    },
    storage: {
      prefix
    }
  });
  // Override default detected key.
  settings.runtime = {
    ip: '10-10-10-10'
  };
  // Override version
  settings.version = 'js-1234';

  const builder = new Keys(settings);

  const splitName = 'split_name__for_testing';
  const metricName = 'getTreatment';
  const bucketNumber = 10;

  const expectedImpressionKey = `${prefix}.SPLITIO/${settings.version}/${settings.runtime.ip}/impressions.${splitName}`;
  const expectedLatencyKey = `${prefix}.SPLITIO/${settings.version}/${settings.runtime.ip}/latency.${metricName}.bucket.${bucketNumber}`;

  assert.true(builder.buildImpressionsKey(splitName) === expectedImpressionKey);
  assert.true(builder.buildLatencyKey(metricName, bucketNumber) === expectedLatencyKey);
  assert.true(builder.extractBucketNumber(expectedLatencyKey) === bucketNumber);

  assert.end();
});
