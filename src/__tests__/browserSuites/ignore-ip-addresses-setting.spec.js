import { SplitFactory } from '../../';
import { settingsFactory } from '../../settings';
import splitChangesMock1 from '../mocks/splitchanges.since.-1.json';
import { DEBUG } from '@splitsoftware/splitio-commons/src/utils/constants';
import { url } from '../testUtils';

// Header keys and expected values. Expected values are obtained with the runtime function evaluated with IPAddressesEnabled in true.
const HEADER_SPLITSDKMACHINEIP = 'SplitSDKMachineIP';
const HEADER_SPLITSDKMACHINENAME = 'SplitSDKMachineName';

// Refresh rates are set to 1 second to finish the test quickly. Otherwise, it would finish in 1 minute (60 seconds is the default value)
const baseConfig = {
  scheduler: {
    metricsRefreshRate: 1,
    impressionsRefreshRate: 1,
    eventsPushRate: 1
  },
  streamingEnabled: false,
  sync: {
    impressionsMode: DEBUG
  }
};

// Config with IPAddressesEnabled set to false
const configWithIPAddressesDisabled = {
  ...baseConfig,
  core: {
    authorizationKey: '<fake-token>',
    key: 'nicolas@split.io',
    IPAddressesEnabled: false
  },
  urls: {
    sdk: 'https://sdk.split-ipdisabled.io/api',
    events: 'https://events.split-ipdisabled.io/api'
  }
};

// Config with IPAddressesEnabled set to true
const configWithIPAddressesEnabled = {
  ...baseConfig,
  core: {
    authorizationKey: '<fake-token>',
    key: 'nicolas@split.io',
    IPAddressesEnabled: true
  },
  urls: {
    sdk: 'https://sdk.split-ipenabled.io/api',
    events: 'https://events.split-ipenabled.io/api'
  }
};

// Config with default IPAddressesEnabled (true)
const configWithIPAddressesDefault = {
  ...baseConfig,
  core: {
    authorizationKey: '<fake-token>',
    key: 'nicolas@split.io'
  },
  urls: {
    sdk: 'https://sdk.split-ipdefault.io/api',
    events: 'https://events.split-ipdefault.io/api'
  }
};

const configSamples = [
  configWithIPAddressesDisabled,
  configWithIPAddressesEnabled,
  configWithIPAddressesDefault
];

const postEndpoints = [
  '/events/bulk',
  '/testImpressions/bulk',
  // @TODO uncomment when telemetry is implemented
  // '/metrics/times',
  // '/metrics/counters'
];

export default function (fetchMock, assert) {

  // Generator to synchronize the call of assert.end() when all Splitio configurations are run.
  const finish = (function* () {
    const CONFIG_SAMPLES_COUNT = configSamples.length;
    for (let i = 0; i < CONFIG_SAMPLES_COUNT - 1; i++) {
      yield;
    }
    assert.end();
  })();

  // Assert request headers
  function assertHeaders(IPAddressesEnabled, req) {
    assert.false(HEADER_SPLITSDKMACHINEIP in req.headers, `Request must not include ${HEADER_SPLITSDKMACHINEIP} header, no matters the value of IPAddressesEnabled.`);
    assert.false(HEADER_SPLITSDKMACHINENAME in req.headers, `Request must not include ${HEADER_SPLITSDKMACHINENAME} header, no matters the value of IPAddressesEnabled.`);
  }

  function mockAndAssertIPAddressesEnabled(config) {

    // Assert properties in impressions logged to impression listener
    config.impressionListener = {
      logImpression: function (impression) {
        assert.false(impression.ip, '"ip" property in impressions must be false, no matters the value of IPAddressesEnabled.');
        assert.false(impression.hostname, '"hostname" property in impressions must be false, no matters the value of IPAddressesEnabled.');
      }
    };

    // Mock GET endpoints before creating the client
    const settings = settingsFactory(config);
    fetchMock.getOnce(url(settings, '/splitChanges?since=-1'), { status: 200, body: splitChangesMock1 });
    fetchMock.getOnce(url(settings, '/splitChanges?since=1457552620999'), { status: 200, body: { splits: [], since: 1457552620999, till: 1457552620999 } });
    fetchMock.getOnce(url(settings, `/mySegments/${encodeURIComponent(config.core.key)}`), { status: 200, body: { mySegments: [] } });

    // Init Split client
    const splitio = SplitFactory(config);
    const client = splitio.client();

    // Generator to synchronize the destruction of the client when all the post endpoints where called once.
    const finishConfig = (function* () {
      const POST_ENDPOINTS_TO_TEST = postEndpoints.length;
      for (let i = 0; i < POST_ENDPOINTS_TO_TEST - 1; i++) {
        yield;
      }
      client.destroy();
      finish.next();
    })();

    // Mock and assert POST endpoints
    postEndpoints.forEach(postEndpoint => {
      fetchMock.postOnce(url(settings, postEndpoint), (url, opts) => {
        assertHeaders(settings.core.IPAddressesEnabled, opts);
        finishConfig.next();
        return 200;
      });
    });

    // Run normal client flow
    client.ready().then(() => {
      client.getTreatment('hierarchical_splits_test');
      client.track('sometraffictype', 'someEvent', 10);
    });
  }

  configSamples.forEach(
    configSample => mockAndAssertIPAddressesEnabled(configSample)
  );

}