import tape from 'tape-catch';
import fetchMock from '../testUtils/fetchMock';
import { url } from '../testUtils';
import evaluationsSuite from '../browserSuites/evaluations.spec';
import impressionsSuite from '../browserSuites/impressions.spec';
import impressionsSuiteDebug from '../browserSuites/impressions.debug.spec';
import impressionsSuiteNone from '../browserSuites/impressions.none.spec';
import telemetrySuite from '../browserSuites/telemetry.spec';
import impressionsListenerSuite from '../browserSuites/impressions-listener.spec';
import readinessSuite from '../browserSuites/readiness.spec';
import readyFromCache from '../browserSuites/ready-from-cache.spec';
import { withoutBindingTT, bindingTT } from '../browserSuites/events.spec';
import sharedInstantiationSuite from '../browserSuites/shared-instantiation.spec';
import managerSuite from '../browserSuites/manager.spec';
import ignoreIpAddressesSettingSuite from '../browserSuites/ignore-ip-addresses-setting.spec';
import useBeaconApiSuite from '../browserSuites/use-beacon-api.spec';
import useBeaconDebugApiSuite from '../browserSuites/use-beacon-api.debug.spec';
import readyPromiseSuite from '../browserSuites/ready-promise.spec';
import { fetchSpecificSplits, fetchSpecificSplitsForFlagSets } from '../browserSuites/fetch-specific-splits.spec';
import userConsent from '../browserSuites/user-consent.spec';
import singleSync from '../browserSuites/single-sync.spec';
import flagSets from '../browserSuites/flag-sets.spec';

import { settingsFactory } from '../../settings';
import splitChangesMock1 from '../mocks/splitchanges.since.-1.json';
import splitChangesMock2 from '../mocks/splitchanges.since.1457552620999.json';
import mySegmentsFacundo from '../mocks/mysegments.facundo@split.io.json';
import mySegmentsNicolas from '../mocks/mysegments.nicolas@split.io.json';
import mySegmentsMarcio from '../mocks/mysegments.marcio@split.io.json';
import mySegmentsEmmanuel from '../mocks/mysegments.emmanuel@split.io.json';

const settings = settingsFactory({
  core: {
    key: 'facundo@split.io'
  },
  streamingEnabled: false
});

const configInMemory = {
  core: {
    authorizationKey: '<fake-token>',
    key: 'facundo@split.io'
  },
  scheduler: {
    featuresRefreshRate: 1,
    segmentsRefreshRate: 1,
    impressionsRefreshRate: 3000  // for now I don't want to publish impressions during E2E run.
  },
  streamingEnabled: false
};

const configInMemoryWithBucketingKey = {
  core: {
    authorizationKey: '<fake-token>',
    key: {
      matchingKey: 'facundo@split.io',
      bucketingKey: 'some_id'
    }
  },
  scheduler: {
    featuresRefreshRate: 1,
    segmentsRefreshRate: 1,
    impressionsRefreshRate: 3000  // for now I don't want to publish impressions during E2E run.
  },
  streamingEnabled: false
};

const configInLocalStorage = {
  core: {
    authorizationKey: '<fake-token>',
    key: 'facundo@split.io'
  },
  scheduler: {
    featuresRefreshRate: 1,
    segmentsRefreshRate: 1,
    impressionsRefreshRate: 3000  // for now I don't want to publish impressions during E2E run.
  },
  storage: {
    type: 'LOCALSTORAGE',
    prefix: 'e2eTEST'    // Avoid storage name clashes
  },
  streamingEnabled: false
};

tape('## E2E CI Tests ##', function (assert) {
  //If we change the mocks, we need to clear localstorage. Cleaning up after testing ensures "fresh data".
  localStorage.clear();

  fetchMock.get(url(settings, '/splitChanges?s=1.1&since=-1'), { status: 200, body: splitChangesMock1 });
  fetchMock.get(url(settings, '/splitChanges?s=1.1&since=1457552620999'), { status: 200, body: splitChangesMock2 });
  fetchMock.get(url(settings, '/mySegments/facundo%40split.io'), { status: 200, body: mySegmentsFacundo });
  fetchMock.get(url(settings, '/mySegments/nicolas%40split.io'), { status: 200, body: mySegmentsNicolas });
  fetchMock.get(url(settings, '/mySegments/marcio%40split.io'), { status: 200, body: mySegmentsMarcio });
  fetchMock.get(url(settings, '/mySegments/emmanuel%40split.io'), { status: 200, body: mySegmentsEmmanuel });
  fetchMock.post(url(settings, '/testImpressions/bulk'), 200);
  fetchMock.post(url(settings, '/testImpressions/count'), 200);
  Math.random = () => 0.5; // SDKs without telemetry

  /* Check client evaluations. */
  assert.test('E2E / In Memory', evaluationsSuite.bind(null, configInMemory, fetchMock));
  assert.test('E2E / In Memory with Bucketing Key', evaluationsSuite.bind(null, configInMemoryWithBucketingKey, fetchMock));
  assert.test('E2E / In LocalStorage with In Memory Fallback', evaluationsSuite.bind(null, configInLocalStorage, fetchMock));
  /* Check impressions */
  assert.test('E2E / Impressions', impressionsSuite.bind(null, fetchMock));
  assert.test('E2E / Impressions Debug Mode', impressionsSuiteDebug.bind(null, fetchMock));
  assert.test('E2E / Impressions None Mode', impressionsSuiteNone.bind(null, fetchMock));
  /* Check impression listener */
  assert.test('E2E / Impression listener', impressionsListenerSuite);
  /* Check telemetry */
  assert.test('E2E / Telemetry', telemetrySuite.bind(null, fetchMock));
  /* Check events */
  assert.test('E2E / Events', withoutBindingTT.bind(null, fetchMock));
  assert.test('E2E / Events with TT binded', bindingTT.bind(null, fetchMock));
  /* Check shared clients */
  assert.test('E2E / Shared instances', sharedInstantiationSuite.bind(null, false, false, fetchMock));
  assert.test('E2E / Shared instances with Traffic Type on factory settings', sharedInstantiationSuite.bind(null, true, false, fetchMock));
  /* Validate user consent */
  assert.test('E2E / User consent', userConsent.bind(null, fetchMock));
  /* Check basic manager functionality */
  assert.test('E2E / Manager API', managerSuite.bind(null, settings, fetchMock));
  /* Validate readiness */
  assert.test('E2E / Readiness', readinessSuite.bind(null, fetchMock));
  /* Validate headers for ip and hostname are not sended with requests (ignore setting IPAddressesEnabled) */
  assert.test('E2E / Ignore setting IPAddressesEnabled', ignoreIpAddressesSettingSuite.bind(null, fetchMock));
  /* Check that impressions and events are sended to backend via Beacon API or Fetch when pagehide/visibilitychange events are triggered. */
  assert.test('E2E / Use Beacon API (or Fetch if not available) to send remaining impressions and events when browser page is unload or hidden', useBeaconApiSuite.bind(null, fetchMock));
  assert.test('E2E / Use Beacon API DEBUG (or Fetch if not available) to send remaining impressions and events when browser page is unload or hidden', useBeaconDebugApiSuite.bind(null, fetchMock));
  /* Validate ready from cache behaviour (might be merged into another suite if we end up having simple behavior around it as expected) */
  assert.test('E2E / Readiness from cache', readyFromCache.bind(null, fetchMock));
  /* Validate readiness with ready promises */
  assert.test('E2E / Ready promise', readyPromiseSuite.bind(null, fetchMock));
  /* Validate fetching specific splits */
  assert.test('E2E / Fetch specific splits', fetchSpecificSplits.bind(null, fetchMock));
  assert.test('E2E / Fetch specific splits for flag sets', fetchSpecificSplitsForFlagSets.bind(null, fetchMock));
  /* Validate single sync */
  assert.test('E2E / Single sync', singleSync.bind(null, fetchMock));
  /* Validate flag sets */
  assert.test('E2E / Flag sets', flagSets.bind(null, fetchMock));

  //If we change the mocks, we need to clear localstorage. Cleaning up after testing ensures "fresh data".
  localStorage.clear();

  assert.end();
});
