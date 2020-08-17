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
  urls: baseUrls,
  streamingEnabled: false
});

export default function (fetchMock, assert) {
  // Mocking this specific route to make sure we only get the items we want to test from the handlers.
  fetchMock.getOnce(settings.url('/splitChanges?since=-1'), { status: 200, body: splitChangesMock1 });
  fetchMock.get(settings.url('/splitChanges?since=1457552620999'), { status: 200, body: splitChangesMock2 });
  fetchMock.get(settings.url('/mySegments/facundo%40split.io'), { status: 200, body: mySegmentsFacundo });

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
    urls: baseUrls,
    streamingEnabled: false
  });

  const client = splitio.client();
  const assertPayload = req => {
    const resp = JSON.parse(req.body);

    assert.equal(resp.length, 2, 'We performed two evaluations so we should have 2 impressions');

    const dependencyChildImpr = resp.filter(e => e.testName === 'hierarchical_splits_test')[0];
    const alwaysOnWithConfigImpr = resp.filter(e => e.testName === 'split_with_config')[0];

    assert.true(dependencyChildImpr, 'Split we wanted to evaluate should be present on the impressions.');
    assert.false(resp.some(e => e.testName === 'hierarchical_dep_always_on'), 'Parent split evaluations should not result in impressions.');
    assert.false(resp.some(e => e.testName === 'hierarchical_dep_hierarchical'), 'No matter how deep is the chain.');
    assert.true(alwaysOnWithConfigImpr, 'Split evaluated with config should have generated an impression too.');
    assert.false(Object.prototype.hasOwnProperty.call(alwaysOnWithConfigImpr.keyImpressions[0], 'configuration'), 'Impressions do not change with configuration evaluations.');
    assert.false(Object.prototype.hasOwnProperty.call(alwaysOnWithConfigImpr.keyImpressions[0], 'config'), 'Impressions do not change with configuration evaluations.');

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

  fetchMock.postOnce(settings.url('/testImpressions/bulk'), (url, req) => {
    assertPayload(req);
    assert.comment('After a failure, Impressions will keep the data for the next call.');
    return 400;
  });
  // Attach again to catch the retry.
  fetchMock.postOnce(settings.url('/testImpressions/bulk'), (url, req) => {
    assert.comment('We do one retry, so after a failed impressions post we will try once more.');
    assertPayload(req);

    client.destroy();
    assert.end();

    return 200;
  });
  fetchMock.postOnce(settings.url('/testImpressions/bulk'), 200);

  client.ready().then(() => {
    // depends on hierarchical_dep_hierarchical which depends on hierarchical_dep_always_on
    assert.equal(client.getTreatment('hierarchical_splits_test'), 'on', 'We should get an evaluation as always.');
    assert.deepEqual(client.getTreatmentWithConfig('split_with_config'), {
      treatment: 'on',
      config: '{"color":"brown","dimensions":{"height":12,"width":14},"text":{"inner":"click me"}}'
    }, 'We should get an evaluation as always.');
  });
}
