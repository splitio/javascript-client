import { SplitFactory } from '../../';
import { settingsFactory } from '../../settings';
import splitChangesMock1 from '../mocks/splitchanges.since.-1.json';
import splitChangesMock2 from '../mocks/splitchanges.since.1457552620999.json';
import { DEBUG } from '@splitsoftware/splitio-commons/src/utils/constants';
import { truncateTimeFrame } from '@splitsoftware/splitio-commons/src/utils/time';
import { url } from '../testUtils';

const baseUrls = {
  sdk: 'https://sdk.baseurl/impressionsDebugSuite',
  events: 'https://events.baseurl/impressionsDebugSuite'
};

const settings = settingsFactory({
  core: {
    key: '<fake id>'
  },
  urls: baseUrls,
  streamingEnabled: false
});

const config = {
  core: {
    authorizationKey: '<fake-token-2>'
  },
  scheduler: {
    featuresRefreshRate: 1,
    segmentsRefreshRate: 1,
    impressionsRefreshRate: 3000,
    impressionsQueueSize: 3 // flush impressions when 3 are queued
  },
  urls: baseUrls,
  startup: {
    eventsFirstPushWindow: 3000
  },
  sync: {
    impressionsMode: DEBUG
  },
  streamingEnabled: false
};

let truncatedTimeFrame;

export default async function (key, fetchMock, assert) {
  // Mocking this specific route to make sure we only get the items we want to test from the handlers.
  fetchMock.getOnce(url(settings, '/splitChanges?s=1.3&since=-1&rbSince=-1'), { status: 200, body: splitChangesMock1 });
  fetchMock.get(url(settings, '/splitChanges?s=1.3&since=1457552620999&rbSince=-1'), { status: 200, body: splitChangesMock2 });
  fetchMock.get(new RegExp(`${url(settings, '/segmentChanges/')}.*`), { status: 200, body: { since: 10, till: 10, name: 'segmentName', added: [], removed: [] } });

  const splitio = SplitFactory(config);
  const client = splitio.client();
  let readyEvaluationsStart = 0;

  fetchMock.postOnce(url(settings, '/testImpressions/bulk'), (url, opts) => {
    assert.equal(opts.headers.SplitSDKImpressionsMode, DEBUG);
    const data = JSON.parse(opts.body);

    assert.deepEqual(data, [{
      f: 'split_with_config',
      i: [{
        k: 'facundo@split.io', t: 'o.n', m: data[0].i[0].m, c: 828282828282, r: 'another expected label', b: 'test_buck_key'
      }, {
        k: 'facundo@split.io', t: 'o.n', m: data[0].i[1].m, c: 828282828282, r: 'another expected label', b: 'test_buck_key', pt: data[0].i[0].m
      }, {
        k: 'facundo@split.io', t: 'o.n', m: data[0].i[2].m, c: 828282828282, r: 'another expected label', b: 'test_buck_key', pt: data[0].i[1].m
      }, {
        k: 'emi@split.io', t: 'o.n', m: data[0].i[3].m, c: 828282828282, r: 'another expected label', properties: '{"prop1":"value1"}'
      }, {
        k: 'emi@split.io', t: 'o.n', m: data[0].i[4].m, c: 828282828282, r: 'another expected label', properties: '{"prop1":"value2"}'
      }, {
        k: 'emi@split.io', t: 'o.n', m: data[0].i[5].m, c: 828282828282, r: 'another expected label', properties: '{"prop1":"value3"}'
      }, {
        k: 'emi@split.io', t: 'o.n', m: data[0].i[6].m, c: 828282828282, r: 'another expected label', properties: '{"prop1":"value4"}'
      }]
    }], 'We performed evaluations for one split, so we should have 1 item total.');

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

  fetchMock.postOnce(url(settings, '/v1/keys/ss'), (url, opts) => {
    assert.deepEqual(JSON.parse(opts.body), {
      keys: [{ f: 'always_on_impressions_disabled_true', ks: ['other_key'] }]
    }, 'We should track unique keys for the feature with track impressions disabled.');

    return 200;
  });

  await client.ready();

  readyEvaluationsStart = Date.now();
  truncatedTimeFrame = truncateTimeFrame(readyEvaluationsStart);

  assert.equal(client.getTreatment({ matchingKey: key, bucketingKey: 'test_buck_key' }, 'split_with_config'), 'o.n');
  assert.equal(client.getTreatment({ matchingKey: key, bucketingKey: 'test_buck_key' }, 'split_with_config'), 'o.n');
  assert.equal(client.getTreatment({ matchingKey: key, bucketingKey: 'test_buck_key' }, 'split_with_config'), 'o.n');
  assert.equal(client.getTreatment({ matchingKey: 'other_key', bucketingKey: 'test_buck_key' }, 'always_on_impressions_disabled_true'), 'on');

  assert.equal(client.getTreatment('emi@split.io', 'split_with_config', undefined, { properties: { prop1: 'value1' } }), 'o.n');
  assert.equal(client.getTreatments('emi@split.io', ['split_with_config'], undefined, { properties: { prop1: 'value2' } }).split_with_config, 'o.n');
  assert.equal(client.getTreatmentWithConfig('emi@split.io', 'split_with_config', undefined, { properties: { prop1: 'value3' } }).treatment, 'o.n');
  assert.equal(client.getTreatmentsWithConfig('emi@split.io', ['split_with_config'], undefined, { properties: { prop1: 'value4' } }).split_with_config.treatment, 'o.n');
}
