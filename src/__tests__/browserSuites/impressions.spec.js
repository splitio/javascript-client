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
      featuresRefreshRate: 0.5,
      segmentsRefreshRate: 0.5,
      metricsRefreshRate: 3000,
      impressionsRefreshRate: 0.5
    },
    startup: {
      eventsFirstPushWindow: 3000
    }
  });
  const client = splitio.client();
  const assertPayload = req => {
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
  };

  mock.onPost(settings.url('/testImpressions/bulk'))
    .replyOnce(req => {
      assertPayload(req);
      assert.comment('First call will fail, so data will be tested again on retry.');
      return [400];
    })
    // Attach again to catch the retry.
    .onPost(settings.url('/testImpressions/bulk'))
    .replyOnce(req => {
      assert.comment('After a failure, Impressions will keep the date for a next call.');
      assertPayload(req);

      client.destroy();
      assert.end();

      return [200];
    });

  client.ready().then(() => {
    // depends on hierarchical_dep_hierarchical which depends on hierarchical_dep_always_on
    assert.equal(client.getTreatment('hierarchical_splits_test'), 'on', 'We should get an evaluation as always.');
  });
}
