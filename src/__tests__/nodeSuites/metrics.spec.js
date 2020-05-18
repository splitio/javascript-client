import { SplitFactory } from '../../';
import SettingsFactory from '../../utils/settings';
import splitChangesMock1 from '../mocks/splitchanges.since.-1.json';
import splitChangesMock2 from '../mocks/splitchanges.since.1457552620999.json';

const baseUrls = {
  sdk: 'https://sdk.baseurl/metricsSuite',
  events: 'https://events.baseurl/metricsSuite'
};

const settings = SettingsFactory({
  core: {
    key: '<fake id>'
  },
  urls: baseUrls
});

const config = {
  core: {
    authorizationKey: '<fake-token-2>'
  },
  scheduler: {
    featuresRefreshRate: 99999,
    segmentsRefreshRate: 99999,
    metricsRefreshRate: 3,
    impressionsRefreshRate: 99999
  },
  urls: baseUrls,
  startup: {
    eventsFirstPushWindow: 3000
  }
};

export default async function(key, fetchMock, assert) {
  const segmentChangesUrlRegex = new RegExp(`${baseUrls.sdk}/segmentChanges/*`);

  fetchMock.getOnce(settings.url('/splitChanges?since=-1'), 500);
  fetchMock.getOnce(settings.url('/splitChanges?since=-1'), { status: 200, body: splitChangesMock1 });
  fetchMock.getOnce(segmentChangesUrlRegex, { status: 200, body: { since:10, till:10, name: 'segmentName', added: [], removed: [] } });
  fetchMock.getOnce(segmentChangesUrlRegex, 401);
  fetchMock.getOnce(segmentChangesUrlRegex, 500);
  fetchMock.get(segmentChangesUrlRegex, { status: 200, body: {since:10, till:10, name: 'segmentName' + Date.now(), added: [], removed: []} });
  // Should not execute but adding just in case.
  fetchMock.get(settings.url('/splitChanges?since=1457552620999'), { status: 200, body: splitChangesMock2 });

  fetchMock.postOnce(settings.url('/testImpressions/bulk'), 200);

  const splitio = SplitFactory(config);
  const client = splitio.client();

  const finish = (function*() {
    yield;
    client.destroy();
    assert.end();
  })();

  fetchMock.postOnce(settings.url('/metrics/times'), (url, opts) => {
    const data = JSON.parse(opts.body);

    assert.equal(data.length, 7, 'We performed 4 correct evaluation requests (one per method) plus ready, splits and segments, so we should have 7 latency metrics.');

    const latencyMetricsRecorded = data.filter(metric => {
      // At least one latency registed per metric
      return metric.latencies.some(count => count > 0);
    });

    // If we have 7 items, it is because each one had at least ONE entry.
    assert.equal(latencyMetricsRecorded.length, 7, 'Each metric has at least one enty, matching the calls.');

    const getLatencyCount = metricName => {
      const latencyMetric = data.find(metric => metric.name === metricName);

      if (!latencyMetric && !Array.isArray(latencyMetric.latencies)) return 0;

      return latencyMetric.latencies.reduce((accum, entry) => accum + entry, 0);
    };

    // Validate both names and values.
    assert.equal(getLatencyCount('splitChangeFetcher.time'), 2, 'Two latency metrics for splitChanges');
    assert.equal(getLatencyCount('segmentChangeFetcher.time'), 1, 'One latency metric for segmentChangeFetcher');
    assert.equal(getLatencyCount('sdk.ready'), 1, 'One latency metric for ready');
    assert.equal(getLatencyCount('sdk.getTreatment'), 1, 'One latency metric for getTreatment');
    assert.equal(getLatencyCount('sdk.getTreatments'), 1, 'One latency metric for getTreatments');
    assert.equal(getLatencyCount('sdk.getTreatmentWithConfig'), 1, 'One latency metric for getTreatmentWithConfig');
    assert.equal(getLatencyCount('sdk.getTreatmentsWithConfig'), 1, 'One latency metric for getTreatmentsWithConfig');

    finish.next();

    return 200;
  });

  fetchMock.postOnce(settings.url('/metrics/counters'), (url, opts) => {
    const data = JSON.parse(opts.body);

    assert.equal(data.length, 4, 'Based on the mock setup, we should have four items.');

    const countMetricsRecorded = data.reduce((accum, metric) => accum + metric.delta, 0);

    const getRecordsCount = metricName => {
      const countMetric = data.find(metric => metric.name === metricName);

      if (!countMetric) return 0;

      return countMetric.delta;
    };

    // 5 items:
    // For splitChanges, 1 exception and 1 200.
    // For segmentChanges (3 segments) 1 with 200, two errors.
    assert.equal(countMetricsRecorded, 5, 'Each metric has one entry, same as the amount of calls.');
    // break down
    assert.equal(getRecordsCount('splitChangeFetcher.exception'), 1, 'The metric names and delta should correspond to the SDK behaviour.');
    assert.equal(getRecordsCount('segmentChangeFetcher.exception'), 2, 'The metric names and delta should correspond to the SDK behaviour.');
    assert.equal(getRecordsCount('splitChangeFetcher.status.200'), 1, 'The metric names and delta should correspond to the SDK behaviour.');
    assert.equal(getRecordsCount('segmentChangeFetcher.status.200'), 1, 'The metric names and delta should correspond to the SDK behaviour.');

    finish.next();

    return 200;
  });

  await client.ready();

  // treatments and results are only validated so we know for sure when the function was actually running to compare the metrics.
  assert.equal(client.getTreatment(key, 'always_on'), 'on', 'Evaluation was correct.');
  assert.equal(client.getTreatment(false, 'always_on'), 'control', 'We should return control with invalid input.');

  assert.deepEqual(client.getTreatmentWithConfig(key, 'split_with_config'), {
    treatment: 'on',
    config: '{"color":"brown","dimensions":{"height":12,"width":14},"text":{"inner":"click me"}}'
  }, 'Evaluation with config was correct.');
  assert.deepEqual(client.getTreatmentWithConfig(null, 'split_with_config'), {
    treatment: 'control',
    config: null
  }, 'Evaluation with config returned control state for invalid input.');

  assert.deepEqual(client.getTreatments(key, ['always_on', 'always_off']), { always_on:'on', always_off:'off' }, 'Evaluations were correct.');
  assert.deepEqual(client.getTreatments(false, ['always_on', 'always_off', null]), { always_on:'control', always_off:'control' }, 'We should return map of controls with invalid input.');

  assert.deepEqual(client.getTreatmentsWithConfig(key, ['split_with_config', 'always_on', null]),
    {
      split_with_config: {
        treatment: 'on',
        config: '{"color":"brown","dimensions":{"height":12,"width":14},"text":{"inner":"click me"}}'
      },
      always_on: {
        treatment: 'on',
        config: null
      }
    }
    , 'Evaluations with config were correct.');
  assert.deepEqual(client.getTreatmentsWithConfig(null, ['split_with_config', 'always_on', null]),
    {
      split_with_config: {
        treatment: 'control',
        config: null
      },
      always_on: {
        treatment: 'control',
        config: null
      }
    },
    'Evaluations with config returned control states for invalid input.');
}
