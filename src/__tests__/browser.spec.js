'use strict';
// Requiring the Split Facade, which requires 'isomorphic-fetch'
require('../');
// This override the default implementation, so you MUST to be sure you include
// this AFTER the require('isomorphic-fetch')
const fetchMock = require('fetch-mock');

const evaluationsSuite = require('./browserSuites/evaluations.spec');
const impressionsSuite = require('./browserSuites/impressions.spec');
const eventsSuite = require('./browserSuites/events.spec');
const sharedInstantiationSuite = require('./browserSuites/shared-instantiation.spec');

const tape = require('tape');
const SettingsFactory = require('../utils/settings');
const settings = SettingsFactory({
  core: {
    key: 'facundo@split.io'
  }
});

const splitChangesMock1 = require('./mocks/splitchanges.since.-1.json');
const splitChangesMock2 = require('./mocks/splitchanges.since.1457552620999.json');
const mySegmentsFacundo = require('./mocks/mysegments.facundo@split.io.json');
const mySegmentsNicolas = require('./mocks/mysegments.nicolas@split.io.json');
const mySegmentsMarcio = require('./mocks/mysegments.marcio@split.io.json');

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
  assert.test('E2E / Events', eventsSuite.withoutBindingTT);
  assert.test('E2E / Events with TT binded', eventsSuite.bindingTT);
  /* Check shared clients */
  assert.test('E2E / Shared instances', sharedInstantiationSuite.bind(null, false));
  assert.test('E2E / Shared instances with Traffic Type on factory settings', sharedInstantiationSuite.bind(null, true));

  //If we change the mocks, we need to clear localstorage. Cleaning up after testing ensures "fresh data".
  localStorage.clear();

  assert.end();
});
