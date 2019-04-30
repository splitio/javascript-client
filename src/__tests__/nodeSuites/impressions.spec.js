import { SplitFactory } from '../../';
import SettingsFactory from '../../utils/settings';
import splitChangesMock1 from '../mocks/splitchanges.since.-1.json';
import splitChangesMock2 from '../mocks/splitchanges.since.1457552620999.json';

const baseUrls = {
  sdk: 'https://sdk.baseurl/impressionsSuite',
  events: 'https://events.baseurl/impressionsSuite'
};

const settings = SettingsFactory({
  core: {
    key: '<fake id>'
  },
  urls: baseUrls
});

const config = {
  core: {
    authorizationKey: '<fake-token-2>'
  },
  scheduler: {
    featuresRefreshRate: 1,
    segmentsRefreshRate: 1,
    metricsRefreshRate: 3000,
    impressionsRefreshRate: 1
  },
  urls: baseUrls,
  startup: {
    eventsFirstPushWindow: 3000
  }
};

export default async function(key, mock, assert) {
  // Mocking this specific route to make sure we only get the items we want to test from the handlers.
  mock.onGet(settings.url('/splitChanges?since=-1')).replyOnce(200, splitChangesMock1);
  mock.onGet(settings.url('/splitChanges?since=1457552620999')).replyOnce(200, splitChangesMock2);
  const splitio = SplitFactory(config);
  const client = splitio.client();

  mock.onPost(settings.url('/testImpressions/bulk')).replyOnce(req => {
    const data = JSON.parse(req.data);

    assert.equal(data.length, 2, 'We performed two correct evaluations so we should have 2 impressions.');

    const dependencyChildImpr = data.filter(e => e.testName === 'hierarchical_splits_test')[0];
    const alwaysOnWithConfigImpr = data.filter(e => e.testName === 'split_with_config')[0];

    assert.true(dependencyChildImpr, 'Split we wanted to evaluate should be present on the impressions.');
    assert.false(data.some(e => e.testName === 'hierarchical_dep_always_on'), 'Parent split evaluations should not result in impressions.');
    assert.false(data.some(e => e.testName === 'hierarchical_dep_hierarchical'), 'No matter how deep is the chain.');
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

    // Not push impressions with a invalid key (aka matching key)
    assert.true(
      dependencyChildImpr.keyImpressions.filter(e => e.keyName !== 'facundo@split.io').length === 0,
      'There should be impressions with valid keys, the sdk will not push a impression with invalid a key'
    );

    client.destroy();
    assert.end();

    return [200];
  });

  await client.ready();

  // depends on hierarchical_dep_hierarchical which depends on hierarchical_dep_always_on
  assert.equal(client.getTreatment(key, 'hierarchical_splits_test'), 'on', 'We should get an evaluation as always.');
  assert.equal(client.getTreatment(false, 'hierarchical_splits_test'), 'control', 'We should return control with a invalid key.');
  assert.deepEqual(client.getTreatmentWithConfig(key, 'split_with_config'), {
    treatment: 'on',
    config: '{"color":"brown","dimensions":{"height":12,"width":14},"text":{"inner":"click me"}}'
  }, 'We should get an evaluation as always.');
}
