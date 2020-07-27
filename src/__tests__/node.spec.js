import tape from 'tape-catch';
import fetchMock from './testUtils/fetchMock';
import SettingsFactory from '../utils/settings';

import evaluationsSuite from './nodeSuites/evaluations.spec';
import eventsSuite from './nodeSuites/events.spec';
import impressionsSuite from './nodeSuites/impressions.spec';
import metricsSuite from './nodeSuites/metrics.spec';
import impressionsListenerSuite from './nodeSuites/impressions-listener.spec';
import expectedTreatmentsSuite from './nodeSuites/expected-treatments.spec';
import managerSuite from './nodeSuites/manager.spec';
import ipAddressesSetting from './nodeSuites/ip-addresses-setting.spec';
import readyPromiseSuite from './nodeSuites/ready-promise.spec';
import fetchSpecificSplits from './nodeSuites/fetch-specific-splits.spec';

import splitChangesMock1 from './mocks/splitchanges.since.-1.json';
import splitChangesMock2 from './mocks/splitchanges.since.1457552620999.json';

const settings = SettingsFactory({
  core: {
    authorizationKey: '<fake-token>'
  },
  streamingEnabled: false
});

const config = {
  core: {
    authorizationKey: '<fake-token-1>'
  },
  scheduler: {
    featuresRefreshRate: 1,
    segmentsRefreshRate: 1,
    metricsRefreshRate: 3000, // for now I don't want to publish metrics during E2E run.
    impressionsRefreshRate: 3000  // for now I don't want to publish impressions during E2E run.
  },
  streamingEnabled: false
};

const key = 'facundo@split.io';

fetchMock.get(settings.url('/splitChanges?since=-1'), { status: 200, body: splitChangesMock1 });
fetchMock.get(settings.url('/splitChanges?since=1457552620999'), { status: 200, body: splitChangesMock2 });
fetchMock.get(new RegExp(`${settings.url('/segmentChanges')}/*`), {
  status: 200, body: {
    'name': 'segment',
    'added': [],
    'removed': [],
    'since': 1,
    'till': 1
  }
});
fetchMock.post(settings.url('/testImpressions/bulk'), 200);

tape('## Node JS - E2E CI Tests ##', async function (assert) {
  /* Check client evaluations. */
  assert.test('E2E / In Memory', evaluationsSuite.bind(null, config, key));

  /* Check impressions */
  assert.test('E2E / Impressions', impressionsSuite.bind(null, key, fetchMock));
  assert.test('E2E / Impressions listener', impressionsListenerSuite);

  /* Check metrics */
  assert.test('E2E / Metrics', metricsSuite.bind(null, key, fetchMock));

  /* Check events in memory */
  assert.test('E2E / Events', eventsSuite.bind(null, fetchMock));

  /* Check that a treatment is the expected one for the key */
  assert.test('E2E / Expected Treatments by key', expectedTreatmentsSuite.bind(null, config, settings, fetchMock));

  /* Manager basic tests */
  assert.test('E2E / Manager basics', managerSuite.bind(null, settings, fetchMock));

  /* Check IP address and Machine name headers when IP address setting is enabled and disabled */
  assert.test('E2E / IP Addresses Setting', ipAddressesSetting.bind(null, fetchMock));

  /* Validate readiness with ready promises */
  assert.test('E2E / Ready promise', readyPromiseSuite.bind(null, key, fetchMock));

  /* Validate fetching specific splits */
  assert.test('E2E / Fetch specific splits', fetchSpecificSplits.bind(null, fetchMock));

  assert.end();
});
