import { SplitFactory } from '../../';
import SettingsFactory from '../../utils/settings';

const settings = SettingsFactory({
  core: {
    key: 'asd'
  }
});

export default function(mock, assert) {

  const splitio = SplitFactory({
    core: {
      authorizationKey: '<some-token>',
      key: 'facundo@split.io'
    },
    scheduler: {
      featuresRefreshRate: 1,
      segmentsRefreshRate: 1,
      metricsRefreshRate: 3000,
      impressionsRefreshRate: 1
    },
    startup: {
      eventsFirstPushWindow: 3000
    }
  });
  const client = splitio.client();

  mock.onPost(settings.url('/testImpressions/bulk')).replyOnce(req => {
    const resp = JSON.parse(req.data);

    const dependencyChildImpr = resp.filter(e => e.testName === 'hierarchical_splits_test')[0];

    assert.true(dependencyChildImpr, 'Split we wanted to evaluate should be present on the impressions.');
    assert.false(resp.some(e => e.testName === 'hierarchical_dep_always_on'), 'Parent split evaluations should not result in impressions.');
    assert.false(resp.some(e => e.testName === 'hierarchical_dep_hierarchical'), 'No matter how deep is the chain.');

    const {
      keyName,
      label,
      treatment
    } = dependencyChildImpr.keyImpressions[0];

    assert.equal(keyName, 'facundo@split.io', 'Present impression should have the correct key.');
    // The label present on the mock.
    assert.equal(label, 'expected label', 'Present impression should have the correct label.');
    assert.equal(treatment, 'on', 'Present impression should have the correct treatment.');

    client.destroy();
    assert.end();

    return [200];
  });

  client.ready().then(() => {
    // depends on hierarchical_dep_hierarchical which depends on hierarchical_dep_always_on
    assert.equal(client.getTreatment('hierarchical_splits_test'), 'on', 'We should get an evaluation as always.');
  });
}
