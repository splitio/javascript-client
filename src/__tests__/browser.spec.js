import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import evaluationsSuite from './browserSuites/evaluations.spec';
import impressionsSuite from './browserSuites/impressions.spec';
import metricsSuite from './browserSuites/metrics.spec';
import impressionsListenerSuite from './browserSuites/impressions-listener.spec';
import {
  withoutBindingTT,
  bindingTT
} from './browserSuites/events.spec';
import sharedInstantiationSuite from './browserSuites/shared-instantiation.spec';
import managerSuite from './browserSuites/manager.spec';

import tape from 'tape-catch';
import SettingsFactory from '../utils/settings';
const settings = SettingsFactory({
  core: {
    key: 'facundo@split.io'
  }
});

import splitChangesMock1 from './mocks/splitchanges.since.-1.json';
import splitChangesMock2 from './mocks/splitchanges.since.1457552620999.json';
import mySegmentsFacundo from './mocks/mysegments.facundo@split.io.json';
import mySegmentsNicolas from './mocks/mysegments.nicolas@split.io.json';
import mySegmentsMarcio from './mocks/mysegments.marcio@split.io.json';

// Set the mock adapter on the default instance
const mock = new MockAdapter(axios);

const settingsInMemory = {
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

const settingsInMemoryWithBucketingKey = {
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

const settingsInLocalStorage = {
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

  mock.onGet(settings.url('/splitChanges?since=-1')).reply(200, splitChangesMock1);
  mock.onGet(settings.url('/splitChanges?since=1457552620999')).reply(200, splitChangesMock2);
  mock.onGet(settings.url('/mySegments/facundo@split.io')).reply(200, mySegmentsFacundo);
  mock.onGet(settings.url('/mySegments/nicolas@split.io')).reply(200, mySegmentsNicolas);
  mock.onGet(settings.url('/mySegments/marcio@split.io')).reply(200, mySegmentsMarcio);

  /* Check client evaluations. */
  assert.test('E2E / In Memory', evaluationsSuite.bind(null, settingsInMemory));
  assert.test('E2E / In Memory with Bucketing Key', evaluationsSuite.bind(null, settingsInMemoryWithBucketingKey));
  assert.test('E2E / In LocalStorage with In Memory Fallback', evaluationsSuite.bind(null, settingsInLocalStorage));
  /* Check impressions */
  assert.test('E2E / Impressions', impressionsSuite.bind(null, mock));
  /* Check impression listener */
  assert.test('E2E / Impression listener', impressionsListenerSuite);
  /* Check metrics */
  assert.test('E2E / Metrics', metricsSuite.bind(null, mock));
  /* Check events */
  assert.test('E2E / Events', withoutBindingTT.bind(null, mock));
  assert.test('E2E / Events with TT binded', bindingTT.bind(null, mock));
  /* Check shared clients */
  assert.test('E2E / Shared instances', sharedInstantiationSuite.bind(null, false, mock));
  assert.test('E2E / Shared instances with Traffic Type on factory settings', sharedInstantiationSuite.bind(null, true, mock));
  /* Check basic manager functionality */
  assert.test('E2E / Manager API', managerSuite.bind(null, settings, mock));

  //If we change the mocks, we need to clear localstorage. Cleaning up after testing ensures "fresh data".
  localStorage.clear();

  assert.end();
});
