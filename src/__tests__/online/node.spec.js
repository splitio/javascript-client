import tape from 'tape-catch';
import fetchMock from '../testUtils/nodeFetchMock';
import { url } from '../testUtils';
import { settingsFactory } from '../../settings/node';

import evaluationsSuite from '../nodeSuites/evaluations.spec';
import evaluationsSemverSuite from '../nodeSuites/evaluations-semver.spec';
import eventsSuite from '../nodeSuites/events.spec';
import impressionsSuite from '../nodeSuites/impressions.spec';
import impressionsSuiteDebug from '../nodeSuites/impressions.debug.spec';
import impressionsSuiteNone from '../nodeSuites/impressions.none.spec';
import telemetrySuite from '../nodeSuites/telemetry.spec';
import impressionsListenerSuite from '../nodeSuites/impressions-listener.spec';
import expectedTreatmentsSuite from '../nodeSuites/expected-treatments.spec';
import managerSuite from '../nodeSuites/manager.spec';
import ipAddressesSetting from '../nodeSuites/ip-addresses-setting.spec';
import ipAddressesSettingDebug from '../nodeSuites/ip-addresses-setting.debug.spec';
import readinessSuite from '../nodeSuites/readiness.spec';
import readyPromiseSuite from '../nodeSuites/ready-promise.spec';
import { fetchSpecificSplits, fetchSpecificSplitsForFlagSets } from '../nodeSuites/fetch-specific-splits.spec';

import splitChangesMock1 from '../mocks/splitchanges.since.-1.json';
import splitChangesMock2 from '../mocks/splitchanges.since.1457552620999.json';
import flagSets from '../nodeSuites/flag-sets.spec';

const config = {
  core: {
    authorizationKey: '<fake-token-1>'
  },
  scheduler: {
    featuresRefreshRate: 1,
    segmentsRefreshRate: 1,
    impressionsRefreshRate: 3000  // for now I don't want to publish impressions during E2E run.
  },
  streamingEnabled: false
};

const settings = settingsFactory(config);
const key = 'facundo@split.io';

fetchMock.get(url(settings, '/splitChanges?since=-1'), { status: 200, body: splitChangesMock1 });
fetchMock.get(url(settings, '/splitChanges?since=1457552620999'), { status: 200, body: splitChangesMock2 });
fetchMock.get(new RegExp(`${url(settings, '/segmentChanges')}/*`), {
  status: 200, body: {
    'name': 'segment',
    'added': [],
    'removed': [],
    'since': 1,
    'till': 1
  }
});
fetchMock.post(url(settings, '/testImpressions/bulk'), 200);
fetchMock.post(url(settings, '/testImpressions/count'), 200);
fetchMock.post(url(settings, '/v1/metrics/config'), 200);
fetchMock.post(url(settings, '/v1/metrics/usage'), 200);

tape('## Node JS - E2E CI Tests ##', async function (assert) {
  /* Check client evaluations. */
  assert.test('E2E / In Memory', evaluationsSuite.bind(null, config, key));
  assert.test('E2E / In Memory - Semver', evaluationsSemverSuite.bind(null, fetchMock));

  /* Check impressions */
  assert.test('E2E / Impressions', impressionsSuite.bind(null, key, fetchMock));
  assert.test('E2E / Impressions Debug Mode', impressionsSuiteDebug.bind(null, key, fetchMock));
  assert.test('E2E / Impressions None Mode', impressionsSuiteNone.bind(null, key, fetchMock));
  assert.test('E2E / Impressions listener', impressionsListenerSuite);

  /* Check telemetry */
  assert.test('E2E / Telemetry', telemetrySuite.bind(null, key, fetchMock));

  /* Check events in memory */
  assert.test('E2E / Events', eventsSuite.bind(null, fetchMock));

  /* Check that a treatment is the expected one for the key */
  assert.test('E2E / Expected Treatments by key', expectedTreatmentsSuite.bind(null, config, settings, fetchMock));

  /* Manager basic tests */
  assert.test('E2E / Manager basics', managerSuite.bind(null, settings, fetchMock));

  /* Check IP address and Machine name headers when IP address setting is enabled and disabled */
  assert.test('E2E / IP Addresses Setting', ipAddressesSetting.bind(null, fetchMock));
  assert.test('E2E / IP Addresses Setting Debug', ipAddressesSettingDebug.bind(null, fetchMock));

  /* Validate readiness */
  assert.test('E2E / Readiness', readinessSuite.bind(null, fetchMock));

  /* Validate readiness with ready promises */
  assert.test('E2E / Ready promise', readyPromiseSuite.bind(null, key, fetchMock));

  /* Validate fetching specific splits */
  assert.test('E2E / Fetch specific splits', fetchSpecificSplits.bind(null, fetchMock));
  assert.test('E2E / Fetch specific splits for flag sets', fetchSpecificSplitsForFlagSets.bind(null, fetchMock));

  /* Validate flag sets */
  assert.test('E2E / Flag sets', flagSets.bind(null, fetchMock));

  assert.end();
});
