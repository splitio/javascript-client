import { SplitFactory } from '../../';
import splitChangesMock1 from '../mocks/splitchanges.since.-1.json';
import { url, mockSegmentChanges } from '../testUtils';

const baseUrls = {
  sdk: 'https://sdk.baseurl/telemetrySuite',
  events: 'https://events.baseurl/telemetrySuite',
  telemetry: 'https://telemetry.baseurl/telemetrySuite',
};

const config = {
  core: {
    authorizationKey: '<fake-token-2>'
  },
  scheduler: {
    featuresRefreshRate: 99999,
    telemetryRefreshRate: 60
  },
  urls: baseUrls,
  streamingEnabled: false
};

export default async function telemetryNodejsSuite(key, fetchMock, assert) {

  fetchMock.getOnce(url(config, '/splitChanges?since=-1'), 500); // record http exception
  fetchMock.getOnce(url(config, '/splitChanges?since=-1'), { status: 200, body: splitChangesMock1 });
  mockSegmentChanges(fetchMock, new RegExp(config.urls.sdk + '/segmentChanges/*'), ['some_key']);

  fetchMock.postOnce(url(config, '/testImpressions/bulk'), 200);
  fetchMock.postOnce(url(config, '/testImpressions/count'), 200);
  fetchMock.postOnce(url(config, '/events/bulk'), 200);

  const splitio = SplitFactory(config, ({ settings }) => {
    assert.equal(settings.scheduler.telemetryRefreshRate, 60000);
    settings.scheduler.telemetryRefreshRate = 1000; // set below minimum to validate matrics/usage requests
  });
  const client = splitio.client();

  const finish = (function* () {
    yield;
    client.destroy();
    assert.end();
  })();

  let lastSync;

  // 1st metrics/usage call due to telemetryRefreshRate set in 1 second
  fetchMock.postOnce(url(config, '/v1/metrics/usage'), (url, opts) => {
    const data = JSON.parse(opts.body);

    // Validate last successful sync
    assert.deepEqual(Object.keys(data.lS), ['sp', 'se', 'te'], 'Successful split changes, segment changes and telemetry config requests');
    lastSync = data.lS; delete data.lS;

    // Validate http and method latencies
    const getLatencyCount = buckets => buckets ? buckets.reduce((accum, entry) => accum + entry, 0) : 0;
    assert.equal(getLatencyCount(data.hL.sp), 2, 'Two latency metrics for splitChanges GET request');
    assert.equal(getLatencyCount(data.hL.se), 6, 'Six latency metrics for segmentChanges GET request');
    assert.equal(getLatencyCount(data.hL.te), 1, 'One latency metric for telemetry config POST request');
    assert.equal(getLatencyCount(data.mL.t), 2, 'Two latency metrics for getTreatment (one not ready usage');
    assert.equal(getLatencyCount(data.mL.ts), 1, 'One latency metric for getTreatments');
    assert.equal(getLatencyCount(data.mL.tc), 1, 'One latency metric for getTreatmentWithConfig');
    assert.equal(getLatencyCount(data.mL.tcs), 1, 'One latency metric for getTreatmentsWithConfig');
    assert.equal(getLatencyCount(data.mL.tr), 1, 'One latency metric for track');
    delete data.hL; delete data.mL;

    // @TODO check if iDe value is correct
    assert.deepEqual(data, {
      mE: {}, hE: { sp: { 500: 1 } }, tR: 0, aR: 0, iQ: 4, iDe: 1, iDr: 0, spC: 31, seC: 3, skC: 3, eQ: 1, eD: 0, sE: [], t: [], ufs: { sp: 0, ms: 0 }
    }, 'metrics/usage JSON payload should be the expected');

    finish.next();
    return 200;
  });

  // 2nd metrics/usage call due to destroy
  fetchMock.postOnce(url(config, '/v1/metrics/usage'), (url, opts) => {
    const data = JSON.parse(opts.body);

    assert.deepEqual(data.lS, lastSync, 'last successful sync hasn\'t change');
    delete data.lS;

    assert.true(data.sL > 0, 'sessionLengthMs must be defined');
    delete data.sL;
    // @TODO check if iDe value is correct
    assert.deepEqual(data, {
      mL: {}, mE: {}, hE: {}, hL: {}, // errors and latencies were popped
      tR: 0, aR: 0, iQ: 4, iDe: 1, iDr: 0, spC: 31, seC: 3, skC: 3, eQ: 1, eD: 0, sE: [], t: [], ufs: { sp: 0, ms: 0 }
    }, '2nd metrics/usage JSON payload should be the expected');
    return 200;
  });

  fetchMock.postOnce(url(config, '/v1/metrics/config'), (url, opts) => {
    const data = JSON.parse(opts.body);

    assert.true(data.tR > 0, 'timeUntilReady is larger than 0');
    delete data.tR; // delete to validate other properties

    assert.deepEqual(data, {
      oM: 0, st: 'memory', aF: 1, rF: 0, sE: false,
      rR: { sp: 99999, se: 60, im: 300, ev: 60, te: 1 } /* override featuresRefreshRate */,
      uO: { s: true, e: true, a: false, st: false, t: true } /* override sdk, events and telemetry URLs */,
      iQ: 30000, eQ: 500, iM: 0, iL: false, hP: false, nR: 1 /* 1 non ready usage */, t: [], uC: 0 /* NA */
    }, 'metrics/config JSON payload should be the expected');

    finish.next();

    return 200;
  });

  assert.equal(client.getTreatment(key, 'always_on'), 'control', 'Non ready usage.');

  await client.ready();

  // treatments and results are only validated so we know for sure when the function was actually running to compare the metrics.
  assert.equal(client.getTreatment(key, 'always_on'), 'on', 'Evaluation was correct.');
  assert.equal(client.getTreatment(false, 'always_on'), 'control', 'We should return control with invalid input.');

  assert.deepEqual(client.getTreatmentWithConfig(key, 'split_with_config'), {
    treatment: 'o.n',
    config: '{"color":"brown","dimensions":{"height":12,"width":14},"text":{"inner":"click me"}}'
  }, 'Evaluation with config was correct.');
  assert.deepEqual(client.getTreatmentWithConfig(null, 'split_with_config'), {
    treatment: 'control',
    config: null
  }, 'Evaluation with config returned control state for invalid input.');

  assert.deepEqual(client.getTreatments(key, ['always_on', 'always_off']), { always_on: 'on', always_off: 'off' }, 'Evaluations were correct.');
  assert.deepEqual(client.getTreatments(false, ['always_on', 'always_off', null]), { always_on: 'control', always_off: 'control' }, 'We should return map of controls with invalid input.');

  assert.deepEqual(client.getTreatmentsWithConfig(key, ['split_with_config', 'always_on', null]),
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

  assert.equal(client.track(key, 'someTT', 'someEvent'), true, 'Event was queued');
  assert.equal(client.track(false, 'someTT', 'someEvent'), false, 'Invalid input.');

}
