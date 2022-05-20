import { SplitFactory } from '../../';
import splitChangesMock1 from '../mocks/splitchanges.since.-1.json';

const baseUrls = {
  sdk: 'https://sdk.baseurl/telemetrySuite',
  events: 'https://events.baseurl/telemetrySuite',
  telemetry: 'https://telemetry.baseurl/telemetrySuite',
};

const config = {
  core: {
    authorizationKey: '<fake-token-2>',
    key: 'user-key'
  },
  scheduler: {
    featuresRefreshRate: 99999,
    telemetryRefreshRate: 60
  },
  urls: baseUrls,
  streamingEnabled: false
};

export default async function telemetryBrowserSuite(fetchMock, assert) {
  fetchMock.getOnce(baseUrls.sdk + '/splitChanges?since=-1', 500);
  fetchMock.getOnce(baseUrls.sdk + '/splitChanges?since=-1', { status: 200, body: splitChangesMock1 });
  fetchMock.getOnce(baseUrls.sdk + '/mySegments/user-key', 500);
  fetchMock.getOnce(baseUrls.sdk + '/mySegments/user-key', { status: 200, body: { 'mySegments': [ 'one_segment'] } });

  // We need to handle all requests properly
  fetchMock.postOnce(baseUrls.events + '/testImpressions/bulk', 200);
  fetchMock.postOnce(baseUrls.events + '/testImpressions/count', 200);
  fetchMock.postOnce(baseUrls.events + '/events/bulk', 200);

  // Overwrite Math.random to instantiate factory with telemetry
  const originalMathRandom = Math.random; Math.random = () => 0.001;
  const splitio = SplitFactory(config, ({ settings }) => {
    assert.equal(settings.scheduler.telemetryRefreshRate, 60000);
    settings.scheduler.telemetryRefreshRate = 1000; // set below minimum to validate matrics/usage requests
  });
  Math.random = originalMathRandom; // restore

  const client = splitio.client();

  const finish = (function* () {
    yield;
    client.destroy();
    assert.end();
  })();

  let lastSync;

  // 1st metrics/usage call due to telemetryRefreshRate set in 1 second
  fetchMock.postOnce(baseUrls.telemetry + '/v1/metrics/usage', (url, opts) => {
    const data = JSON.parse(opts.body);

    // Validate last successful sync
    assert.deepEqual(Object.keys(data.lS), ['sp', 'ms', 'te'], 'Successful splitChanges, mySegments and metrics/config requests');
    lastSync = data.lS; delete data.lS;

    // Validate http and method latencies
    const getLatencyCount = buckets => buckets ? buckets.reduce((accum, entry) => accum + entry, 0) : 0;
    assert.equal(getLatencyCount(data.hL.sp), 2, 'Two latency metrics for splitChanges GET request');
    assert.equal(getLatencyCount(data.hL.ms), 2, 'Two latency metrics for mySegments GET request');
    assert.equal(getLatencyCount(data.hL.te), 1, 'One latency metric for telemetry config POST request');
    assert.equal(getLatencyCount(data.mL.t), 2, 'Two latency metrics for getTreatment (one not ready usage');
    assert.equal(getLatencyCount(data.mL.ts), 1, 'One latency metric for getTreatments');
    assert.equal(getLatencyCount(data.mL.tc), 1, 'One latency metric for getTreatmentWithConfig');
    assert.equal(getLatencyCount(data.mL.tcs), 1, 'One latency metric for getTreatmentsWithConfig');
    assert.equal(getLatencyCount(data.mL.tr), 1, 'One latency metric for track');
    delete data.hL; delete data.mL;

    assert.deepEqual(data, {
      mE: {}, hE: { sp: { 500: 1 }, ms: { 500: 1 } }, tR: 0, aR: 0, iQ: 4, iDe: 3, iDr: 0, spC: 31, seC: 1, skC: 1, eQ: 1, eD: 0, sE: [], t: []
    }, 'metrics/usage JSON payload should be the expected');

    finish.next();
    return 200;
  });

  // 2nd metrics/usage call due to destroy
  fetchMock.postOnce(baseUrls.telemetry + '/v1/metrics/usage', (url, opts) => {
    const data = JSON.parse(opts.body);

    assert.deepEqual(data.lS, lastSync, 'last successful sync hasn\'t change');
    delete data.lS;

    assert.true(data.sL > 0, 'sessionLengthMs must be defined');
    delete data.sL;

    assert.deepEqual(data, {
      mL: {}, mE: {}, hE: {}, hL: {}, // errors and latencies were popped
      tR: 0, aR: 0, iQ: 4, iDe: 3, iDr: 0, spC: 31, seC: 1, skC: 1, eQ: 1, eD: 0, sE: [], t: []
    }, '2nd metrics/usage JSON payload should be the expected');
    return 200;
  });

  fetchMock.postOnce(baseUrls.telemetry + '/v1/metrics/config', (url, opts) => {
    const data = JSON.parse(opts.body);

    assert.true(data.tR > 0, 'timeUntilReady is larger than 0');
    delete data.tR; // delete to validate other properties

    assert.deepEqual(data, {
      oM: 0, st: 'memory', aF: 1, rF: 0, sE: false,
      rR: { sp: 99999, ms: 60, im: 300, ev: 60, te: 1 } /* override featuresRefreshRate */,
      uO: { s: true, e: true, a: false, st: false, t: true } /* override sdk, events and telemetry URLs */,
      iQ: 30000, eQ: 500, iM: 0, iL: false, hP: false, nR: 1 /* 1 non ready usage */, t: [], i: [], uC: 2 /* Default GRANTED */
    }, 'metrics/config JSON payload should be the expected');

    finish.next();

    return 200;
  });

  assert.equal(client.getTreatment('always_on'), 'control', 'Non ready usage.');

  await client.ready();

  // treatments and results are only validated so we know for sure when the function was actually running to compare the metrics.
  assert.equal(client.getTreatment('always_on'), 'on', 'Evaluation was correct.');
  assert.equal(client.getTreatment('always_on', () => { }), 'control', 'We should return control with invalid input.');

  assert.deepEqual(client.getTreatmentWithConfig('split_with_config'), {
    treatment: 'o.n',
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
        treatment: 'o.n',
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

  assert.equal(client.track('someTT', 'someEvent'), true, 'Event was queued');
  assert.equal(client.track('someTT', null), false, 'Invalid input.');

}
