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
    const reqBody = JSON.parse(req.body);

    assert.deepEqual(reqBody, [{
      f: 'hierarchical_splits_test',
      i: [{
        k: 'facundo@split.io', t: 'on', m: reqBody[0].i[0].m, c: 2828282828, r: 'expected label'
      }]
    }, {
      f: 'split_with_config',
      i: [{
        k: 'facundo@split.io', t: 'o.n', m: reqBody[1].i[0].m, c: 828282828282, r: 'another expected label'
      }, {
        k: 'facundo@split.io', t: 'o.n', m: reqBody[1].i[1].m, c: 828282828282, r: 'another expected label', properties: '{"some":"value2"}'
      }]
    }], 'We performed evaluations for 3 features, but one with `impressionsDisabled` true, so we should have 2 items total');
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

  fetchMock.postOnce(url(settings, '/testImpressions/count'), (url, req) => {
    const reqBody = JSON.parse(req.body);

    assert.deepEqual(reqBody, {
      pf: [{
        f: 'split_with_config', m: truncatedTimeFrame, rc: 2
      }, {
        f: 'always_on_impressions_disabled_true', m: truncatedTimeFrame, rc: 1
      }]
    }, 'We should generate impressions count for 2 features.');

    return 200;
  });

  fetchMock.postOnce(url(settings, '/v1/keys/cs'), (url, opts) => {
    assert.deepEqual(JSON.parse(opts.body), {
      keys: [{ fs: ['always_on_impressions_disabled_true'], k: 'facundo@split.io' }]
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
    client.getTreatmentWithConfig('split_with_config', undefined, { properties: { /* empty properties are ignored */ } });

    // Impression should not be tracked (passed properties will not be submitted)
    assert.equal(client.getTreatment('always_on_impressions_disabled_true'), 'on', undefined, { properties: { some: 'value1' } });

    // Tracked impression with properties should be handled in DEBUG mode (doesn't increase `rc` count but adds an impression)
    assert.equal(client.getTreatment('split_with_config', undefined, { properties: { some: 'value2' } }), 'o.n');
  });
}
