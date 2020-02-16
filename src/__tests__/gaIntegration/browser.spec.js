import tape from 'tape-catch';
import MockAdapter from 'axios-mock-adapter';
import splitToGaSuite from './split-to-ga.spec';

import { __getAxiosInstance } from '../../services/transport';
import SettingsFactory from '../../utils/settings';

import splitChangesMock1 from '../mocks/splitchanges.since.-1.json';
import mySegmentsFacundo from '../mocks/mysegments.facundo@split.io.json';

// Set the mock adapter on the current axios instance
const mock = new MockAdapter(__getAxiosInstance());

const settings = SettingsFactory({
  core: {
    key: 'facundo@split.io'
  }
});

tape('## E2E CI Tests ##', function(assert) {

  mock.onGet(settings.url('/splitChanges?since=-1')).reply(200, splitChangesMock1);
  mock.onGet(settings.url('/mySegments/facundo@split.io')).reply(200, mySegmentsFacundo);

  /* Validate GA integration */
  assert.test('E2E / Split-to-GA', splitToGaSuite.bind(null, mock));

  assert.end();
});
