import { SplitFactory } from '../..';
import { settingsFactory } from '../../settings';
import splitChangesMock1 from '../mocks/splitchanges.since.-1.json';
import { url } from '../testUtils';

const baseUrls = {
  sdk: 'https://sdk.baseurl/evaluationsImpressionsDisabledSuite',
  events: 'https://events.baseurl/evaluationsImpressionsDisabledSuite',
  telemetry: 'https://telemetry.baseurl/evaluationsImpressionsDisabledSuite'
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
    authorizationKey: '<fake-token>'
  },
  urls: baseUrls,
  streamingEnabled: false
};

export default async function (fetchMock, assert) {

  assert.test('Evaluations / impressionsDisabled option', async t => {
    // Mocking split changes
    fetchMock.getOnce(url(settings, '/splitChanges?s=1.3&since=-1&rbSince=-1'), { status: 200, body: splitChangesMock1 });
    fetchMock.get(new RegExp(`${url(settings, '/segmentChanges/')}.*`), { status: 200, body: { since: 10, till: 10, name: 'segmentName', added: [], removed: [] } });
    fetchMock.post(url(settings, '/v1/keys/ss'), 200);
    fetchMock.post(url(settings, '/v1/metrics/usage'), 200);
    fetchMock.post(url(settings, '/v1/metrics/config'), 200);
    // Mock default telemetry URLs as fallback
    fetchMock.post('https://telemetry.split.io/api/v1/keys/ss', 200);
    fetchMock.post('https://telemetry.split.io/api/v1/metrics/usage', 200);
    fetchMock.post('https://telemetry.split.io/api/v1/metrics/usage', 200);
    fetchMock.post('https://telemetry.split.io/api/v1/metrics/config', 200);

    fetchMock.post(url(settings, '/testImpressions/bulk'), 200);
    fetchMock.post(url(settings, '/testImpressions/count'), 200);

    const splitio = SplitFactory(config);
    const client = splitio.client();

    await client.ready();

    // getTreatment
    t.equal(client.getTreatment('emi@split.io', 'split_with_config', { impressionsDisabled: true }), 'o.n', 'getTreatment with impressionsDisabled: true returns correct treatment');
    t.equal(client.getTreatment('emi@split.io', 'split_with_config', { impressionsDisabled: false }), 'o.n', 'getTreatment with impressionsDisabled: false returns correct treatment');

    // getTreatments
    t.deepEqual(client.getTreatments('emi@split.io', ['split_with_config', 'whitelist'], { impressionsDisabled: true }), {
      split_with_config: 'o.n',
      whitelist: 'not_allowed'
    }, 'getTreatments with impressionsDisabled: true returns correct treatments');

    // getTreatmentWithConfig
    const expectedConfig = '{"color":"brown","dimensions":{"height":12,"width":14},"text":{"inner":"click me"}}';
    t.deepEqual(client.getTreatmentWithConfig('emi@split.io', 'split_with_config', { impressionsDisabled: true }), {
      treatment: 'o.n',
      config: expectedConfig
    }, 'getTreatmentWithConfig with impressionsDisabled: true returns correct treatment and config');

    // getTreatmentsWithConfig
    t.deepEqual(client.getTreatmentsWithConfig('emi@split.io', ['split_with_config', 'whitelist'], { impressionsDisabled: true }), {
      split_with_config: { treatment: 'o.n', config: expectedConfig },
      whitelist: { treatment: 'not_allowed', config: null }
    }, 'getTreatmentsWithConfig with impressionsDisabled: true returns correct treatments and configs');

    await client.destroy();
    t.end();
  });
}
