import osFunction from 'os';
import * as ipFunction from '../../utils/ip';
import { SplitFactory } from '../../';
import { settingsFactory } from '../../settings';
import splitChangesMock1 from '../mocks/splitchanges.since.-1.json';
import { DEBUG } from '@splitsoftware/splitio-commons/src/utils/constants';
import { url } from '../testUtils';

// Header keys and expected values. Expected values are obtained with the runtime function evaluated with IPAddressesEnabled in true.
const HEADER_SPLITSDKMACHINEIP = 'SplitSDKMachineIP';
const HEADER_SPLITSDKMACHINENAME = 'SplitSDKMachineName';
const IP_VALUE = ipFunction.address();
const HOSTNAME_VALUE = osFunction.hostname();

// Refresh rates are set to 1 second to finish the test quickly. Otherwise, it would finish in 1 minute (60 seconds is the default value)
const baseConfig = {
  streamingEnabled: false,
  sync: {
    impressionsMode: DEBUG,
  },
  core: {
    authorizationKey: '<fake-token>',
    IPAddressesEnabled: true
  },
  urls: {
    sdk: 'https://sdk.split-debug.io/api',
    events: 'https://events.split-debug.io/api',
    telemetry: 'https://telemetry.split-debug.io/api'
  }
};

const postEndpoints = [
  '/events/bulk',
  '/testImpressions/bulk',
  '/v1/metrics/usage',
  '/v1/metrics/config'
];

export default function ipAddressesSettingAssertions(fetchMock, assert) {

  // Assert properties in impressions
  function assertImpression(impression) {
    assert.equal(impression.ip, IP_VALUE, 'Ip did not match');
    assert.equal(impression.hostname, HOSTNAME_VALUE, 'Hostname did not match');
  }

  // Assert request headers
  function assertHeaders(req) {
    assert.equal(req.headers[HEADER_SPLITSDKMACHINEIP], IP_VALUE, `${HEADER_SPLITSDKMACHINEIP} header must be equal to the machine ip.`);
    assert.equal(req.headers[HEADER_SPLITSDKMACHINENAME], HOSTNAME_VALUE, `${HEADER_SPLITSDKMACHINENAME} header must be equal to the machine name.`);
  }

  function mockAndAssertIPAddressesEnabled(config) {

    config.impressionListener = {
      logImpression: function (impression) {
        assertImpression(impression);
      }
    };
    const splitio = SplitFactory(config, ({ settings }) => {
      // Refresh rates are set to 1 second (below minimum values) to finish the test quickly. Otherwise, it would finish in 1 minute (60 seconds is the default value)
      settings.scheduler.impressionsRefreshRate = 1000;
      settings.scheduler.eventsPushRate = 1000;
      settings.scheduler.telemetryRefreshRate = 1000;
    });
    const client = splitio.client();
    const settings = settingsFactory(config);

    // Generator to synchronize the destruction of the client when all the post endpoints where called once.
    const finishConfig = (function* () {
      const POST_ENDPOINTS_TO_TEST = postEndpoints.length;
      for (let i = 0; i < POST_ENDPOINTS_TO_TEST - 1; i++) {
        yield;
      }
      client.destroy();
      assert.end();
    })();

    // Mock GET endpoints to run client normally
    fetchMock.getOnce(url(settings, '/splitChanges?s=1.3&since=-1&rbSince=-1'), { status: 200, body: splitChangesMock1 });
    fetchMock.getOnce(url(settings, '/splitChanges?s=1.3&since=1457552620999&rbSince=-1'), { status: 200, body: { ff: { d: [], s: 1457552620999, t: 1457552620999 } } });
    fetchMock.get(new RegExp(`${url(settings, '/segmentChanges/')}.*`), { status: 200, body: { since: 10, till: 10, name: 'segmentName', added: [], removed: [] } });

    // Mock and assert POST endpoints
    postEndpoints.forEach(postEndpoint => {
      fetchMock.postOnce(url(settings, postEndpoint), (url, opts) => {
        assertHeaders(opts);
        finishConfig.next();
        return 200;
      });
      fetchMock.post(url(settings, postEndpoint), 200);
    });

    // Run normal client flow
    client.on(client.Event.SDK_READY, () => {
      client.getTreatment('nicolas@split.io', 'hierarchical_splits_test');
      client.track('nicolas@split.io', 'sometraffictype', 'someEvent', 10);
    });

  }

  return mockAndAssertIPAddressesEnabled(baseConfig);
}
