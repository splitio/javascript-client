import { SplitFactory } from '../../';
import splitChangesMock1 from '../mocks/splitchanges.since.-1.json';
import splitChangesMock2 from '../mocks/splitchanges.since.1457552620999.json';

const baseUrls = {
  sdk: 'https://sdk.baseurl/metricsSuite',
  events: 'https://events.baseurl/metricsSuite'
};

const config = {
  core: {
    authorizationKey: '<fake-token-2>',
    key: 'metrics-browser-tests-key'
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

export default async function metricsBrowserSuite(fetchMock, assert) {
  fetchMock.getOnce(baseUrls.sdk + '/splitChanges?since=-1', 500);
  fetchMock.get(baseUrls.sdk + '/splitChanges?since=-1', { status: 200, body: splitChangesMock1 });
  fetchMock.getOnce(baseUrls.sdk + '/mySegments/metrics-browser-tests-key', 500);
  fetchMock.get(baseUrls.sdk + '/mySegments/metrics-browser-tests-key', { status: 200, body: { 'mySegments': [] } });
  // Should not execute but adding just in case.
  fetchMock.get(baseUrls.sdk + '/splitChanges?since=1457552620999', { status: 200, body: splitChangesMock2 });

  const splitio = SplitFactory(config);
  const client = splitio.client();

  const finish = (function* () {
    yield;
    client.destroy();
    assert.end();
  })();

  fetchMock.postOnce(baseUrls.events + '/metrics/times', (url, opts) => {
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
    assert.equal(getLatencyCount('splitChangeFetcher.time'), 2, 'Two latency metrics for splitChanges'); // 1 err 1 ok
    assert.equal(getLatencyCount('mySegmentsFetcher.time'), 2, 'One latency metric for mySegmentsFetcher'); // 1 err 1 ok
    assert.equal(getLatencyCount('sdk.ready'), 1, 'One latency metric for ready');
    assert.equal(getLatencyCount('sdk.getTreatment'), 1, 'One latency metric for getTreatment');
    assert.equal(getLatencyCount('sdk.getTreatments'), 1, 'One latency metric for getTreatments');
    assert.equal(getLatencyCount('sdk.getTreatmentWithConfig'), 1, 'One latency metric for getTreatmentWithConfig');
    assert.equal(getLatencyCount('sdk.getTreatmentsWithConfig'), 1, 'One latency metric for getTreatmentsWithConfig');

    finish.next();

    return 200;
  });

  fetchMock.postOnce(baseUrls.events + '/metrics/counters', (url, opts) => {
    const data = JSON.parse(opts.body);

    assert.equal(data.length, 4, 'Based on the mock setup, we should have four items.');

    const countMetricsRecorded = data.reduce((accum, metric) => accum + metric.delta, 0);

    const getRecodsCount = metricName => {
      const countMetric = data.find(metric => metric.name === metricName);

      if (!countMetric) return 0;

      return countMetric.delta;
    };

    // 4 items:
    // For splitChanges, 1 exception and 1 200.
    // For mySegments 1 exception and 1  200.
    assert.equal(countMetricsRecorded, 4, 'Each metric has one entry, same as the amount of calls.');
    // break down
    assert.equal(getRecodsCount('splitChangeFetcher.exception'), 1, 'The metric names and delta should correspond to the SDK behaviour.');
    assert.equal(getRecodsCount('mySegmentsFetcher.exception'), 1, 'The metric names and delta should correspond to the SDK behaviour.');
    assert.equal(getRecodsCount('splitChangeFetcher.status.200'), 1, 'The metric names and delta should correspond to the SDK behaviour.');
    assert.equal(getRecodsCount('mySegmentsFetcher.status.200'), 1, 'The metric names and delta should correspond to the SDK behaviour.');

    finish.next();

    return 200;
  });

  await client.ready();

  // treatments and results are only validated so we know for sure when the function was actually running to compare the metrics.
  assert.equal(client.getTreatment('always_on'), 'on', 'Evaluation was correct.');
  assert.equal(client.getTreatment('always_on', () => { }), 'control', 'We should return control with invalid input.');

  assert.deepEqual(client.getTreatmentWithConfig('split_with_config'), {
    treatment: 'on',
    config: '{"color":"brown","dimensions":{"height":12,"width":14},"text":{"inner":"click me"}}'
  }, 'Evaluation with config was correct.');
  assert.deepEqual(client.getTreatmentWithConfig('split_with_config', () => { }), {
    treatment: 'control',
    config: null
  }, 'Evaluation with config returned control state for invalid input.');

  assert.deepEqual(client.getTreatments(['always_on', 'always_off']), { always_on: 'on', always_off: 'off' }, 'Evaluations were correct.');
  assert.deepEqual(client.getTreatments(['always_on', 'always_off', null], () => { }), { always_on: 'control', always_off: 'control' }, 'We should return map of controls with invalid input.');

  assert.deepEqual(client.getTreatmentsWithConfig(['split_with_config', 'always_on', null]),
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
  assert.deepEqual(client.getTreatmentsWithConfig(['split_with_config', 'always_on', null], () => { }),
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
