'use strict';

// Requiring the Split Facade, which requires 'isomorphic-fetch'
// import '../';

// This override the default implementation, so you MUST to be sure you include
// this AFTER the require('isomorphic-fetch')
import fetchMock from 'fetch-mock';

import evaluationsSuite from './browserSuites/evaluations.spec';
import impressionsSuite from './browserSuites/impressions.spec';
import {
  withoutBindingTT,
  bindingTT
} from './browserSuites/events.spec';
import sharedInstantiationSuite from './browserSuites/shared-instantiation.spec';
import tape from 'tape';
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

const delayResponse = mock => {
  return new Promise(res => setTimeout(res, 0)).then(() => mock);
};

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
  fetchMock.mock(settings.url('/splitChanges?since=-1'), () => delayResponse(splitChangesMock1));
  fetchMock.mock(settings.url('/splitChanges?since=1457552620999'), () => delayResponse(splitChangesMock2));
  fetchMock.mock(settings.url('/mySegments/facundo@split.io'), () => delayResponse(mySegmentsFacundo));
  fetchMock.mock(settings.url('/mySegments/nicolas@split.io'), () => delayResponse(mySegmentsNicolas));
  fetchMock.mock(settings.url('/mySegments/marcio@split.io'), () => delayResponse(mySegmentsMarcio));

  /* Check client evaluations. */
  assert.test('E2E / In Memory', evaluationsSuite.bind(null, settingsInMemory));
  assert.test('E2E / In Memory with Bucketing Key', evaluationsSuite.bind(null, settingsInMemoryWithBucketingKey));
  assert.test('E2E / In LocalStorage with In Memory Fallback', evaluationsSuite.bind(null, settingsInLocalStorage));
  /* Check impressions */
  assert.test('E2E / Impressions', impressionsSuite);
  /* Check events */
  assert.test('E2E / Events', withoutBindingTT);
  assert.test('E2E / Events with TT binded', bindingTT);
  /* Check shared clients */
  assert.test('E2E / Shared instances', sharedInstantiationSuite.bind(null, false));
  assert.test('E2E / Shared instances with Traffic Type on factory settings', sharedInstantiationSuite.bind(null, true));

  //If we change the mocks, we need to clear localstorage. Cleaning up after testing ensures "fresh data".
  localStorage.clear();

  assert.end();
});
