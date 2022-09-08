import { SplitFactory } from '../../';
import { settingsFactory } from '../../settings';
import splitChangesMock1 from '../mocks/splitchanges.since.-1.json';
import splitChangesMock2 from '../mocks/splitchanges.since.1457552620999.json';
import mySegmentsFacundo from '../mocks/mysegments.facundo@split.io.json';
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
  fetchMock.getOnce(url(settings, '/splitChanges?since=-1'), { status: 200, body: splitChangesMock1 });
  fetchMock.get(url(settings, '/splitChanges?since=1457552620999'), { status: 200, body: splitChangesMock2 });
  fetchMock.get(url(settings, '/mySegments/facundo%40split.io'), { status: 200, body: mySegmentsFacundo });

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

    assert.equal(resp.length, 2, 'We performed three evaluations so we should have 2 impressions type');

    const dependencyChildImpr = resp.filter(e => e.f === 'hierarchical_splits_test')[0];
    const alwaysOnWithConfigImpr = resp.filter(e => e.f === 'split_with_config')[0];

    assert.true(dependencyChildImpr, 'Split we wanted to evaluate should be present on the impressions.');
    assert.false(resp.some(e => e.f === 'hierarchical_dep_always_on'), 'Parent split evaluations should not result in impressions.');
    assert.false(resp.some(e => e.f === 'hierarchical_dep_hierarchical'), 'No matter how deep is the chain.');
    assert.true(alwaysOnWithConfigImpr, 'Split evaluated with config should have generated an impression too.');
    assert.false(Object.prototype.hasOwnProperty.call(alwaysOnWithConfigImpr.i[0], 'configuration'), 'Impressions do not change with configuration evaluations.');
    assert.false(Object.prototype.hasOwnProperty.call(alwaysOnWithConfigImpr.i[0], 'config'), 'Impressions do not change with configuration evaluations.');

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

    assert.equal(data.pf.length, 1, 'We should generate impressions count for one feature.');

    // finding these validate the feature names collection too
    const dependencyChildImpr = data.pf.filter(e => e.f === 'hierarchical_splits_test')[0];
    const alwaysOnWithConfigImpr = data.pf.filter(e => e.f === 'split_with_config')[0];

    assert.equal(dependencyChildImpr.rc, 1);
    assert.equal(typeof dependencyChildImpr.m, 'number');
    assert.equal(dependencyChildImpr.m, truncatedTimeFrame);
    assert.equal(alwaysOnWithConfigImpr.rc, 3);
    assert.equal(typeof alwaysOnWithConfigImpr.m, 'number');
    assert.equal(alwaysOnWithConfigImpr.m, truncatedTimeFrame);

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
  });
}
