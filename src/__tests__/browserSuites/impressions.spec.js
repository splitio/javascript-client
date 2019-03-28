import { SplitFactory } from '../../';
import SettingsFactory from '../../utils/settings';
import splitChangesMock1 from '../mocks/splitchanges.since.-1.json';
import splitChangesMock2 from '../mocks/splitchanges.since.1457552620999.json';
import mySegmentsFacundo from '../mocks/mysegments.facundo@split.io.json';

const baseUrls = {
  sdk: 'https://sdk.baseurl/impressionsSuite',
  events: 'https://events.baseurl/impressionsSuite'
};

const settings = SettingsFactory({
  core: {
    key: 'asd'
  },
  urls: baseUrls
});

export default function(mock, assert) {
  // Mocking this specific route to make sure we only get the items we want to test from the handlers.
  mock.onGet(settings.url('/splitChanges?since=-1')).replyOnce(200, splitChangesMock1);
  mock.onGet(settings.url('/splitChanges?since=1457552620999')).reply(200, splitChangesMock2);
  mock.onGet(settings.url('/mySegments/facundo@split.io')).reply(200, mySegmentsFacundo);

  const splitio = SplitFactory({
    core: {
      authorizationKey: '<some-token>',
      key: 'facundo@split.io'
    },
    scheduler: {
      featuresRefreshRate: 0.5,
      segmentsRefreshRate: 0.5,
      metricsRefreshRate: 3000,
      impressionsRefreshRate: 0.5
    },
    startup: {
      eventsFirstPushWindow: 3000
    },
    urls: baseUrls
  });

  const client = splitio.client();
  const assertPayload = req => {
    const resp = JSON.parse(req.data);

    assert.equal(resp.length, 2, 'We performed two evaluations so we should have 2 impressions');

    const dependencyChildImpr = resp.filter(e => e.testName === 'hierarchical_splits_test')[0];
    const alwaysOnWithConfigImpr = resp.filter(e => e.testName === 'split_with_config')[0];

    assert.true(dependencyChildImpr, 'Split we wanted to evaluate should be present on the impressions.');
    assert.false(resp.some(e => e.testName === 'hierarchical_dep_always_on'), 'Parent split evaluations should not result in impressions.');
    assert.false(resp.some(e => e.testName === 'hierarchical_dep_hierarchical'), 'No matter how deep is the chain.');
    assert.true(alwaysOnWithConfigImpr, 'Split evaluated with config should have generated an impression too.');
    assert.false(alwaysOnWithConfigImpr.keyImpressions[0].hasOwnProperty('configuration'), 'Impressions do not change with configuration evaluations.');
    assert.false(alwaysOnWithConfigImpr.keyImpressions[0].hasOwnProperty('config'), 'Impressions do not change with configuration evaluations.');

    const {
      keyName,
      label,
      treatment
    } = dependencyChildImpr.keyImpressions[0];

    assert.equal(keyName, 'facundo@split.io', 'Present impression should have the correct key.');
    // The label present on the mock.
    assert.equal(label, 'expected label', 'Present impression should have the correct label.');
    assert.equal(treatment, 'on', 'Present impression should have the correct treatment.');
  };

  mock.onPost(settings.url('/testImpressions/bulk'))
    .replyOnce(req => {
      assertPayload(req);
      assert.comment('After a failure, Impressions will keep the data for the next call.');
      return [400];
    })
    // Attach again to catch the retry.
    .onPost(settings.url('/testImpressions/bulk'))
    .replyOnce(req => {
      assert.comment('We do one retry, so after a failed impressions post we will try once more.');
      assertPayload(req);

      client.destroy();
      assert.end();

      return [200];
    });

  client.ready().then(() => {
    // depends on hierarchical_dep_hierarchical which depends on hierarchical_dep_always_on
    assert.equal(client.getTreatment('hierarchical_splits_test'), 'on', 'We should get an evaluation as always.');
    assert.deepEqual(client.getTreatmentWithConfig('split_with_config'), {
      treatment: 'on',
      config: '{"color":"brown","dimensions":{"height":12,"width":14},"text":{"inner":"click me"}}'
    }, 'We should get an evaluation as always.');
  });
}
