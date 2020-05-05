import tape from 'tape-catch';
import fetchMock from 'fetch-mock';
import evaluationsSuite from './browserSuites/evaluations.spec';
import impressionsSuite from './browserSuites/impressions.spec';
import metricsSuite from './browserSuites/metrics.spec';
import impressionsListenerSuite from './browserSuites/impressions-listener.spec';
// import readinessSuite from './browserSuites/readiness.spec';
import readyFromCache from './browserSuites/ready-from-cache.spec';
import {
  withoutBindingTT,
  bindingTT
} from './browserSuites/events.spec';
import sharedInstantiationSuite from './browserSuites/shared-instantiation.spec';
import managerSuite from './browserSuites/manager.spec';
import ignoreIpAddressesSettingSuite from './browserSuites/ignore-ip-addresses-setting.spec';
import useBeaconApiSuite from './browserSuites/use-beacon-api.spec';

import SettingsFactory from '../utils/settings';

import splitChangesMock1 from './mocks/splitchanges.since.-1.json';
import splitChangesMock2 from './mocks/splitchanges.since.1457552620999.json';
import mySegmentsFacundo from './mocks/mysegments.facundo@split.io.json';
import mySegmentsNicolas from './mocks/mysegments.nicolas@split.io.json';
import mySegmentsMarcio from './mocks/mysegments.marcio@split.io.json';

// config the fetch mock to chain routes (appends the new route to the list of routes)
fetchMock.config.overwriteRoutes = false;

const settings = SettingsFactory({
  core: {
    key: 'facundo@split.io'
  }
});

const configInMemory = {
  core: {
    authorizationKey: '<fake-token>',
    key: 'facundo@split.io'
  },
  scheduler: {
    featuresRefreshRate: 1,
    segmentsRefreshRate: 1,
    metricsRefreshRate: 3000, // for now I don't want to publish metrics during E2E run.
    impressionsRefreshRate: 3000  // for now I don't want to publish impressions during E2E run.
  }
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
    metricsRefreshRate: 3000, // for now I don't want to publish metrics during E2E run.
    impressionsRefreshRate: 3000  // for now I don't want to publish impressions during E2E run.
  }
};

const configInLocalStorage = {
  core: {
    authorizationKey: '<fake-token>',
    key: 'facundo@split.io'
  },
  scheduler: {
    featuresRefreshRate: 1,
    segmentsRefreshRate: 1,
    metricsRefreshRate: 3000, // for now I don't want to publish metrics during E2E run.
    impressionsRefreshRate: 3000  // for now I don't want to publish impressions during E2E run.
  },
  storage: {
    type: 'LOCALSTORAGE',
    prefix: 'e2eTEST'    // Avoid storage name clashes
  }
};

tape('## E2E CI Tests ##', function(assert) {
  //If we change the mocks, we need to clear localstorage. Cleaning up after testing ensures "fresh data".
  localStorage.clear();

  fetchMock.get(settings.url('/splitChanges?since=-1'), { status: 200, body: splitChangesMock1 });
  fetchMock.get(settings.url('/splitChanges?since=1457552620999'), { status: 200, body: splitChangesMock2 });
  fetchMock.get(settings.url('/mySegments/facundo@split.io'), { status: 200, body: mySegmentsFacundo });
  fetchMock.get(settings.url('/mySegments/nicolas@split.io'), { status: 200, body: mySegmentsNicolas });
  fetchMock.get(settings.url('/mySegments/marcio@split.io'), { status: 200, body: mySegmentsMarcio });

  /* Check client evaluations. */
  assert.test('E2E / In Memory', evaluationsSuite.bind(null, configInMemory, fetchMock));
  assert.test('E2E / In Memory with Bucketing Key', evaluationsSuite.bind(null, configInMemoryWithBucketingKey, fetchMock));
  assert.test('E2E / In LocalStorage with In Memory Fallback', evaluationsSuite.bind(null, configInLocalStorage, fetchMock));
  /* Check impressions */
  assert.test('E2E / Impressions', impressionsSuite.bind(null, fetchMock));
  /* Check impression listener */
  assert.test('E2E / Impression listener', impressionsListenerSuite);
  /* Check metrics */
  assert.test('E2E / Metrics', metricsSuite.bind(null, fetchMock));
  /* Check events */
  assert.test('E2E / Events', withoutBindingTT.bind(null, fetchMock));
  assert.test('E2E / Events with TT binded', bindingTT.bind(null, fetchMock));
  /* Check shared clients */
  assert.test('E2E / Shared instances', sharedInstantiationSuite.bind(null, false, fetchMock));
  assert.test('E2E / Shared instances with Traffic Type on factory settings', sharedInstantiationSuite.bind(null, true, fetchMock));
  /* Check basic manager functionality */
  assert.test('E2E / Manager API', managerSuite.bind(null, settings, fetchMock));
  // /* Validate readiness */
  // assert.test('E2E / Readiness', readinessSuite.bind(null, fetchMock));
  /* Validate headers for ip and hostname are not sended with requests (ignore setting IPAddressesEnabled) */
  assert.test('E2E / Ignore setting IPAddressesEnabled', ignoreIpAddressesSettingSuite.bind(null, fetchMock));
  // /* Check that impressions and events are sended to backend via Beacon API or Fetch when page unload is triggered. */
  // assert.test('E2E / Use Beacon API (or Fetch if not available) to send remaining impressions and events when browser page is unload', useBeaconApiSuite.bind(null, fetchMock));
  /* Validate ready from cache behaviour (might be merged into another suite if we end up having simple behavior around it as expected) */
  assert.test('E2E / Readiness from cache', readyFromCache.bind(null, fetchMock));

  //If we change the mocks, we need to clear localstorage. Cleaning up after testing ensures "fresh data".
  localStorage.clear();

  assert.end();
});
