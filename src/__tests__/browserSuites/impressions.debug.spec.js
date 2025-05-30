import { SplitFactory } from '../../';
import { settingsFactory } from '../../settings';
import splitChangesMock1 from '../mocks/splitchanges.since.-1.json';
import membershipsFacundo from '../mocks/memberships.facundo@split.io.json';
import { DEBUG } from '@splitsoftware/splitio-commons/src/utils/constants';
import { truncateTimeFrame } from '@splitsoftware/splitio-commons/src/utils/time';
import { url } from '../testUtils';

const baseUrls = {
  sdk: 'https://sdk.baseurl/impressionsDebugSuite',
  events: 'https://events.baseurl/impressionsDebugSuite'
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
  fetchMock.getOnce(url(settings, '/splitChanges?s=1.3&since=-1&rbSince=-1'), { status: 200, body: splitChangesMock1 });
  fetchMock.get(url(settings, '/memberships/facundo%40split.io'), { status: 200, body: membershipsFacundo });

  const splitio = SplitFactory({
    core: {
      authorizationKey: '<some-token>',
      key: 'facundo@split.io'
    },
    scheduler: {
      featuresRefreshRate: 0.5,
      segmentsRefreshRate: 0.5,
      impressionsRefreshRate: 3000,
      impressionsQueueSize: 3 // flush impressions when 3 are queued
    },
    startup: {
      eventsFirstPushWindow: 3000
    },
    urls: baseUrls,
    sync: {
      impressionsMode: DEBUG,
    },
    streamingEnabled: false
  });

  const client = splitio.client();

  fetchMock.postOnce(url(settings, '/testImpressions/bulk'), (url, req) => {
    assert.equal(req.headers.SplitSDKImpressionsMode, DEBUG);
    const data = JSON.parse(req.body);

    assert.deepEqual(data, [{
      f: 'split_with_config',
      i: [{
        k: 'facundo@split.io', t: 'o.n', m: data[0].i[0].m, c: 828282828282, r: 'another expected label'
      }, {
        k: 'facundo@split.io', t: 'o.n', m: data[0].i[1].m, c: 828282828282, r: 'another expected label', pt: data[0].i[0].m,
      }, {
        k: 'facundo@split.io', t: 'o.n', m: data[0].i[2].m, c: 828282828282, r: 'another expected label', pt: data[0].i[1].m
      }, {
        k: 'facundo@split.io', t: 'o.n', m: data[0].i[3].m, c: 828282828282, r: 'another expected label', properties: '{"prop1":"value1"}'
      }, {
        k: 'facundo@split.io', t: 'o.n', m: data[0].i[4].m, c: 828282828282, r: 'another expected label', properties: '{"prop1":"value2"}'
      }, {
        k: 'facundo@split.io', t: 'o.n', m: data[0].i[5].m, c: 828282828282, r: 'another expected label', properties: '{"prop1":"value3"}'
      }, {
        k: 'facundo@split.io', t: 'o.n', m: data[0].i[6].m, c: 828282828282, r: 'another expected label', properties: '{"prop1":"value4"}'
      }]
    }]);

    client.destroy().then(() => {
      assert.end();
    });

    return 200;
  });

  fetchMock.postOnce(url(settings, '/testImpressions/count'), (url, opts) => {
    assert.deepEqual(JSON.parse(opts.body), {
      pf: [{ f: 'always_on_impressions_disabled_true', m: truncatedTimeFrame, rc: 1 }]
    }, 'We should generate impression count for the feature with track impressions disabled.');

    return 200;
  });

  fetchMock.postOnce(url(settings, '/v1/keys/cs'), (url, opts) => {
    assert.deepEqual(JSON.parse(opts.body), {
      keys: [{ fs: ['always_on_impressions_disabled_true'], k: 'facundo@split.io' }]
    }, 'We should track unique keys for the feature with track impressions disabled.');

    return 200;
  });

  client.ready().then(() => {
    truncatedTimeFrame = truncateTimeFrame(Date.now());

    client.getTreatment('split_with_config');
    client.getTreatment('split_with_config');
    client.getTreatment('split_with_config');
    assert.equal(client.getTreatment('always_on_impressions_disabled_true'), 'on');

    // with properties
    assert.equal(client.getTreatment('split_with_config', undefined, { properties: { prop1: 'value1' } }), 'o.n');
    assert.equal(client.getTreatments(['split_with_config'], undefined, { properties: { prop1: 'value2' } }).split_with_config, 'o.n');
    assert.equal(client.getTreatmentWithConfig('split_with_config', undefined, { properties: { prop1: 'value3' } }).treatment, 'o.n');
    assert.equal(client.getTreatmentsWithConfig(['split_with_config'], undefined, { properties: { prop1: 'value4' } }).split_with_config.treatment, 'o.n');
  });
}
