import tape from 'tape-catch';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import SettingsFactory from '../utils/settings';

import evaluationsSuite from './nodeSuites/evaluations.spec';
import eventsSuite from './nodeSuites/events.spec';
import impressionsSuite from './nodeSuites/impressions.spec';
import impressionsListenerSuite from './nodeSuites/impressions-listener.spec';
import expectedTreatmentsSuite from './nodeSuites/expected-treatments.spec';
import managerSuite from './nodeSuites/manager.spec';

import splitChangesMock1 from './mocks/splitchanges.since.-1.json';
import splitChangesMock2 from './mocks/splitchanges.since.1457552620999.json';
import mySegmentsFacundo from './mocks/mysegments.facundo@split.io.json';
import mySegmentsNicolas from './mocks/mysegments.nicolas@split.io.json';
import mySegmentsMarcio from './mocks/mysegments.marcio@split.io.json';

const settings = SettingsFactory({
  core: {
    authorizationKey: '<fake-token>'
  }
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
  }
};

const key = 'facundo@split.io';

// Set the mock adapter on the default instance
const mock = new MockAdapter(axios);

mock.onGet(settings.url('/splitChanges?since=-1')).reply(200, splitChangesMock1);
mock.onGet(settings.url('/splitChanges?since=1457552620999')).reply(200, splitChangesMock2);
mock.onGet(settings.url('/mySegments/facundo@split.io')).reply(200, mySegmentsFacundo);
mock.onGet(settings.url('/mySegments/nicolas@split.io')).reply(200, mySegmentsNicolas);
mock.onGet(settings.url('/mySegments/marcio@split.io')).reply(200, mySegmentsMarcio);

tape('## Node JS - E2E CI Tests ##', async function (assert) {
  /* Check client evaluations. */
  assert.test('E2E / In Memory', evaluationsSuite.bind(null, config, key));

  /* Check impressions */
  assert.test('E2E / Impressions', impressionsSuite.bind(null, key, mock));
  assert.test('E2E / Impressions listener', impressionsListenerSuite);

  /* Check events in memory */
  assert.test('E2E / Events', eventsSuite.bind(null, mock));

  /* Check that a treatment is the expected one for the key */
  assert.test('E2E / Expected Treatments by key', expectedTreatmentsSuite.bind(null, config, settings, mock));

  /* Manager basic tests */
  assert.test('E2E / Manager basics', managerSuite.bind(null, settings, mock));
});
