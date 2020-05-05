import tape from 'tape-catch';
import fetchMock from 'fetch-mock';
import gaToSplitSuite from './ga-to-split.spec';
import splitToGaSuite from './split-to-ga.spec';
import bothIntegrationsSuite from './both-integrations.spec';

import SettingsFactory from '../../utils/settings';

import splitChangesMock1 from '../mocks/splitchanges.since.-1.json';
import mySegmentsFacundo from '../mocks/mysegments.facundo@split.io.json';

// config the fetch mock to chain routes (appends the new route to the list of routes)
fetchMock.config.overwriteRoutes = false;

const settings = SettingsFactory({
  core: {
    key: 'facundo@split.io'
  }
});

tape('## E2E CI Tests ##', function(assert) {

  fetchMock.get(settings.url('/splitChanges?since=-1'), { status: 200, body: splitChangesMock1 });
  fetchMock.get(settings.url('/mySegments/facundo@split.io'), { status: 200, body: mySegmentsFacundo });

  /* Validate GA integration */
  assert.test('E2E / GA-to-Split', gaToSplitSuite.bind(null, fetchMock));
  assert.test('E2E / Split-to-GA', splitToGaSuite.bind(null, fetchMock));
  assert.test('E2E / Both GA integrations', bothIntegrationsSuite.bind(null, fetchMock));

  assert.end();
});
