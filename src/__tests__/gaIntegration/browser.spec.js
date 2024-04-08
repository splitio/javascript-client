import tape from 'tape-catch';
import fetchMock from '../testUtils/fetchMock';
import { url } from '../testUtils';
import gaToSplitSuite from './ga-to-split.spec';
import splitToGaSuite from './split-to-ga.spec';
import bothIntegrationsSuite from './both-integrations.spec';

import { settingsFactory } from '../../settings';

import splitChangesMock1 from '../mocks/splitchanges.since.-1.json';
import mySegmentsFacundo from '../mocks/mysegments.facundo@split.io.json';

const settings = settingsFactory({
  core: {
    key: 'facundo@split.io'
  }
});

tape('## E2E CI Tests ##', function (assert) {

  fetchMock.get(url(settings, '/splitChanges?s=1.1&since=-1'), { status: 200, body: splitChangesMock1 });
  fetchMock.get(url(settings, '/mySegments/facundo%40split.io'), { status: 200, body: mySegmentsFacundo });
  fetchMock.post(/\/v1\/metrics/, 200); // 0.1% sample rate

  /* Validate GA integration */
  assert.test('E2E / GA-to-Split', gaToSplitSuite.bind(null, fetchMock));
  assert.test('E2E / Split-to-GA', splitToGaSuite.bind(null, fetchMock));
  assert.test('E2E / Both GA integrations', bothIntegrationsSuite.bind(null, fetchMock));

  assert.end();
});
