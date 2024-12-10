import { SplitFactory } from '../../';
import { settingsFactory } from '../../settings';
import splitChangesMock1 from '../mocks/splitchanges.since.-1.json';
import splitChangesMock2 from '../mocks/splitchanges.since.1457552620999.json';
import membershipsFacundo from '../mocks/memberships.facundo@split.io.json';
import { OPTIMIZED } from '@splitsoftware/splitio-commons/src/utils/constants';
import { truncateTimeFrame } from '@splitsoftware/splitio-commons/src/utils/time';
import { url } from '../testUtils';

const baseUrls = {
  sdk: 'https://sdk.baseurl/impressionsSuite',
  events: 'https://events.baseurl/impressionsSuite'
};

const settings = settingsFactory({
  core: {
    key: 'asd'
  },
  urls: baseUrls,
  streamingEnabled: false
});

let truncatedTimeFrame;

export default function (fetchMock, assert) {
  // Mocking this specific route to make sure we only get the items we want to test from the handlers.
  fetchMock.getOnce(url(settings, '/splitChanges?s=1.2&since=-1'), { status: 200, body: splitChangesMock1 });
  fetchMock.get(url(settings, '/splitChanges?s=1.2&since=1457552620999'), { status: 200, body: splitChangesMock2 });
  fetchMock.get(url(settings, '/memberships/facundo%40split.io'), { status: 200, body: membershipsFacundo });

  const splitio = SplitFactory({
    core: {
      authorizationKey: '<some-token>',
      key: 'facundo@split.io'
    },
    scheduler: {
      featuresRefreshRate: 0.5,
      segmentsRefreshRate: 0.5,
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

    assert.equal(resp.length, 2, 'We performed evaluations for 3 features, but one with `trackImpressions` false, so we should have 2 items total');

    const dependencyChildImpr = resp.filter(e => e.f === 'hierarchical_splits_test')[0];
    const splitWithConfigImpr = resp.filter(e => e.f === 'split_with_config')[0];
    const alwaysOnWithTrackImpressionsFalse = resp.filter(e => e.f === 'always_on_track_impressions_false');

    assert.true(dependencyChildImpr, 'Split we wanted to evaluate should be present on the impressions.');
    assert.false(resp.some(e => e.f === 'hierarchical_dep_always_on'), 'Parent split evaluations should not result in impressions.');
    assert.false(resp.some(e => e.f === 'hierarchical_dep_hierarchical'), 'No matter how deep is the chain.');
    assert.true(splitWithConfigImpr, 'Split evaluated with config should have generated an impression too.');
    assert.false(Object.prototype.hasOwnProperty.call(splitWithConfigImpr.i[0], 'configuration'), 'Impressions do not change with configuration evaluations.');
    assert.false(Object.prototype.hasOwnProperty.call(splitWithConfigImpr.i[0], 'config'), 'Impressions do not change with configuration evaluations.');
    assert.equal(alwaysOnWithTrackImpressionsFalse.length, 0);

    const {
      k,
      r,
      t
    } = dependencyChildImpr.i[0];

    assert.equal(k, 'facundo@split.io', 'Present impression should have the correct key.');
    // The label present on the mock.
    assert.equal(r, 'expected label', 'Present impression should have the correct label.');
    assert.equal(t, 'on', 'Present impression should have the correct treatment.');
  };

  fetchMock.postOnce(url(settings, '/testImpressions/bulk'), (url, req) => {
    assertPayload(req);
    assert.comment('After a failure, Impressions will keep the data for the next call.');
    return 400;
  });
  // Attach again to catch the retry.
  fetchMock.postOnce(url(settings, '/testImpressions/bulk'), (url, req) => {
    assert.equal(req.headers.SplitSDKImpressionsMode, OPTIMIZED);
    assert.comment('We do one retry, so after a failed impressions post we will try once more.');
    assertPayload(req);

    client.destroy().then(() => {
      assert.end();
    });

    return 200;
  });

  fetchMock.postOnce(url(settings, '/testImpressions/count'), (url, opts) => {
    const data = JSON.parse(opts.body);

    assert.equal(data.pf.length, 2, 'We should generate impressions count for 2 features.');

    // finding these validate the feature names collection too
    const splitWithConfigImpr = data.pf.filter(e => e.f === 'split_with_config')[0];
    const alwaysOnWithTrackImpressionsFalse = data.pf.filter(e => e.f === 'always_on_track_impressions_false')[0];

    assert.equal(splitWithConfigImpr.rc, 2);
    assert.equal(typeof splitWithConfigImpr.m, 'number');
    assert.equal(splitWithConfigImpr.m, truncatedTimeFrame);
    assert.equal(alwaysOnWithTrackImpressionsFalse.rc, 1);
    assert.equal(typeof alwaysOnWithTrackImpressionsFalse.m, 'number');
    assert.equal(alwaysOnWithTrackImpressionsFalse.m, truncatedTimeFrame);

    return 200;
  });

  fetchMock.postOnce(url(settings, '/v1/keys/cs'), (url, opts) => {
    assert.deepEqual(JSON.parse(opts.body), {
      keys: [{ fs: [ 'always_on_track_impressions_false' ], k: 'facundo@split.io' }]
    }, 'We should only track unique keys for features flags with track impressions disabled.');

    return 200;
  });

  client.ready().then(() => {
    truncatedTimeFrame = truncateTimeFrame(Date.now());
    // depends on hierarchical_dep_hierarchical which depends on hierarchical_dep_always_on
    assert.equal(client.getTreatment('hierarchical_splits_test'), 'on', 'We should get an evaluation as always.');
    assert.deepEqual(client.getTreatmentWithConfig('split_with_config'), {
      treatment: 'o.n',
      config: '{"color":"brown","dimensions":{"height":12,"width":14},"text":{"inner":"click me"}}'
    }, 'We should get an evaluation as always.');
    client.getTreatmentWithConfig('split_with_config');
    client.getTreatmentWithConfig('split_with_config');

    // Impression should not be tracked
    assert.equal(client.getTreatment('always_on_track_impressions_false'), 'on');
  });
}
